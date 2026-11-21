import sys,numpy as np,json
sys.path.insert(0,'/home/claude/tools'); import fbx
from scipy.spatial.transform import Rotation as Rot
TICKS=46186158000
def load(path):
    r,_=fbx.read(path); objs={c.props[0]:c for c in r.get('Objects').children}
    conns=[(c.props[0],c.props[1],c.props[2],c.props[3] if len(c.props)>3 else None) for c in r.get('Connections').all('C')]
    return r,objs,conns
def name(n): return n.props[1].split('\x00')[0]
def euler_q(deg):  # FBX eEulerXYZ: R = Rz*Ry*Rx  -> scipy extrinsic 'xyz'
    return Rot.from_euler('xyz',deg,degrees=True)
def bones_of(objs,conns):
    bones={k:v for k,v in objs.items() if v.name=='Model' and v.props[2]=='LimbNode'}
    parent={}
    for t,c,p,_ in conns:
        if t=='OO' and c in bones and p in bones: parent[c]=p
    info={}
    for k,v in bones.items():
        P=fbx.props70(v)
        info[k]=dict(name=name(v),parent=parent.get(k),
            T=np.array(P.get('Lcl Translation',[0,0,0]),float),R=np.array(P.get('Lcl Rotation',[0,0,0]),float),
            pre=np.array(P.get('PreRotation',[0,0,0]),float),post=np.array(P.get('PostRotation',[0,0,0]),float),
            S=np.array(P.get('Lcl Scaling',[1,1,1]),float),order=P.get('RotationOrder',[0])[0])
    return info
def local_q(b,R=None):
    return euler_q(b['pre'])*euler_q(b['R'] if R is None else R)*euler_q(b['post']).inv()
def world_mats(info,order):
    W={}
    for k in order:
        b=info[k]; M=np.eye(4); M[:3,:3]=local_q(b).as_matrix(); M[:3,3]=b['T']
        W[k]=(W[b['parent']]@M) if b['parent'] else M
    return W
def topo(info):
    out=[]; seen=set()
    def add(k):
        if k in seen: return
        p=info[k]['parent']
        if p: add(p)
        seen.add(k); out.append(k)
    for k in info: add(k)
    return out

def curves_of(objs,conns,info):
    """bone key -> {'T':{axis:(times,vals)}, 'R':{...}}"""
    cn={k:v for k,v in objs.items() if v.name=='AnimationCurveNode'}
    cv={k:v for k,v in objs.items() if v.name=='AnimationCurve'}
    node_target={}
    for t,c,p,prop in conns:
        if t=='OP' and c in cn and p in info: node_target[c]=(p,{'Lcl Translation':'T','Lcl Rotation':'R','Lcl Scaling':'S'}.get(prop))
    out={}
    for t,c,p,prop in conns:
        if t=='OP' and c in cv and p in node_target:
            b,ch=node_target[p]
            if not ch: continue
            ax={'d|X':0,'d|Y':1,'d|Z':2}[prop]
            times=cv[c].get('KeyTime').props[0].astype(np.float64)/TICKS
            vals=cv[c].get('KeyValueFloat').props[0].astype(np.float64)
            out.setdefault(b,{}).setdefault(ch,{})[ax]=(times,vals)
    return out
def sample_clip(path,fps=30):
    r,objs,conns=load(path); info=bones_of(objs,conns); cur=curves_of(objs,conns,info)
    allt=[t for b in cur.values() for ch in b.values() for (t,v) in ch.values()]
    t0=min(t.min() for t in allt); t1=max(t.max() for t in allt)
    n=max(2,int(round((t1-t0)*fps))+1); ts=t0+np.arange(n)/fps
    by_name={}
    for k,b in info.items():
        def chan(ch,default):
            arr=np.tile(default,(n,1)).astype(float)
            for ax,(t,v) in cur.get(k,{}).get(ch,{}).items(): arr[:,ax]=np.interp(ts,t,v)
            return arr
        R=chan('R',b['R']); T=chan('T',b['T'])
        q=(euler_q(b['pre'])*Rot.from_euler('xyz',R,degrees=True)*euler_q(b['post']).inv()).as_quat()  # x,y,z,w
        # keep quaternion signs continuous
        for i in range(1,n):
            if np.dot(q[i],q[i-1])<0: q[i]=-q[i]
        by_name[b['name']]=dict(q=q,T=T)
    return dict(frames=n,fps=fps,duration=(n-1)/fps,bones=by_name)
