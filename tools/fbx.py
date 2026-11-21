# Minimal binary FBX reader (7.x), enough for Mixamo exports.
import struct, zlib, numpy as np

class Node:
    __slots__=('name','props','children')
    def __init__(s,name,props,children): s.name,s.props,s.children=name,props,children
    def get(s,name):
        for c in s.children:
            if c.name==name: return c
    def all(s,name): return [c for c in s.children if c.name==name]
    def __repr__(s): return f'<{s.name} {s.props[:3]!r} [{len(s.children)}]>'

def read(path):
    d=open(path,'rb').read()
    assert d[:20]==b'Kaydara FBX Binary  ', 'not binary FBX'
    ver=struct.unpack_from('<I',d,23)[0]; big=ver>=7500
    def prop(o):
        t=chr(d[o]); o+=1
        if t=='Y': return struct.unpack_from('<h',d,o)[0],o+2
        if t=='C': return bool(d[o]),o+1
        if t=='I': return struct.unpack_from('<i',d,o)[0],o+4
        if t=='F': return struct.unpack_from('<f',d,o)[0],o+4
        if t=='D': return struct.unpack_from('<d',d,o)[0],o+8
        if t=='L': return struct.unpack_from('<q',d,o)[0],o+8
        if t in 'SR':
            n=struct.unpack_from('<I',d,o)[0]; b=d[o+4:o+4+n]; return (b.decode('utf8','replace') if t=='S' else b),o+4+n
        if t in 'fdlibc':
            n,enc,cl=struct.unpack_from('<III',d,o); o+=12; raw=d[o:o+cl]; o+=cl
            if enc==1: raw=zlib.decompress(raw)
            dt={'f':'<f4','d':'<f8','l':'<i8','i':'<i4','b':'<u1','c':'<u1'}[t]
            return np.frombuffer(raw,dtype=dt,count=n),o
        raise ValueError('prop type '+t)
    def node(o):
        if big: end,np_,pl=struct.unpack_from('<QQQ',d,o); o+=24
        else: end,np_,pl=struct.unpack_from('<III',d,o); o+=12
        nl=d[o]; o+=1
        if end==0: return None,o
        name=d[o:o+nl].decode(); o+=nl
        props=[]
        for _ in range(np_):
            v,o=prop(o); props.append(v)
        kids=[]
        while o<end:
            k,o2=node(o)
            if k is None: o=o2; break
            kids.append(k); o=o2
        return Node(name,props,kids),end
    o=27; top=[]
    while o<len(d)-13*(3 if big else 1):
        n,o2=node(o)
        if n is None: break
        top.append(n); o=o2
    return Node('root',[],top),ver

def props70(n):
    out={}
    p=n.get('Properties70')
    if p:
        for P in p.all('P'):
            out[P.props[0]]=P.props[4:]
    return out
