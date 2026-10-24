"""Adapt the CC-BY Blender Studio Rain rig into a frozen mermaid upper body.

Run with Blender 4.5 --background --disable-autoexec <rain.blend> --python
this_file.py. The artist's embedded scripts remain disabled. See the frame-11
notes for source, attribution and the separately authored Ariel costume/hair.
"""
import bpy
import bmesh
import math
from pathlib import Path
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parent.parent
destination = ROOT / 'scripts/assets/room11/ariel-upper.glb'
destination.unlink(missing_ok=True)
if bpy.context.object and bpy.context.object.mode != 'OBJECT':
    bpy.ops.object.mode_set(mode='OBJECT')
output_collection = bpy.data.collections.new('Ariel export')
bpy.context.scene.collection.children.link(output_collection)
def expose(layer):
    layer.exclude=False
    layer.hide_viewport=False
    for child in layer.children: expose(child)
expose(bpy.context.view_layer.layer_collection)
rig = bpy.data.objects['RIG-rain']
switch = rig.pose.bones['Properties_IKFK']
for key in ['ik_arm_left', 'ik_arm_right', 'ik_fingers_left', 'ik_fingers_right']:
    switch[key] = 0.0
rig.update_tag(refresh={'OBJECT'})
bpy.context.view_layer.update()

def turn(name, axis, angle):
    bone = rig.pose.bones[name]
    origin = bone.matrix.translation.copy()
    bone.matrix = (Matrix.Translation(origin)
                   @ Matrix.Rotation(angle, 4, axis)
                   @ Matrix.Translation(-origin) @ bone.matrix)
    rig.update_tag(refresh={'OBJECT'})
    bpy.context.view_layer.update()

# Relaxed, asymmetric arms follow the actual shoulder/elbow/wrist anatomy.
turn('FK-Upperarm.L', 'Y', .40)
turn('FK-Forearm.L', 'Z', -.90)
turn('FK-Upperarm.R', 'Y', -.25)
turn('FK-Forearm.R', 'Z', 1.10)
for side in ['L', 'R']:
    for finger in ['Index', 'Middle', 'Ring', 'Pinky']:
        for joint, bend in [(1, .12), (2, .19), (3, .10)]:
            bone = rig.pose.bones.get(f'FK-{finger}{joint}.{side}')
            if bone:
                bone.rotation_mode = 'XYZ'
                bone.rotation_euler.x = bend
    # Raise the modeled lip corners together rather than drawing a smile on.
    bone = rig.pose.bones[f'ACT-Lips_Corner.{side}']
    matrix = bone.matrix.copy()
    matrix.translation += Vector((.004 if side == 'L' else -.004, -.001, .006))
    bone.matrix = matrix
rig.update_tag(refresh={'OBJECT'})
bpy.context.view_layer.update()

def linear(hex_color):
    rgb = [(hex_color >> shift & 255) / 255 for shift in [16, 8, 0]]
    return tuple(c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in rgb)

def material(name, color, roughness=.78, vertex=False):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    node = mat.node_tree.nodes.get('Principled BSDF')
    node.inputs['Base Color'].default_value = (*linear(color), 1)
    node.inputs['Roughness'].default_value = roughness
    if vertex:
        pigment = mat.node_tree.nodes.new('ShaderNodeVertexColor')
        pigment.layer_name = 'Pigment'
        mat.node_tree.links.new(pigment.outputs['Color'], node.inputs['Base Color'])
    return mat

skin = material('warm painted skin with modeled facial anatomy', 0xf3c6a9, vertex=True)
red = material('soft auburn brows', 0x983b27)
lash = material('warm fine eyelashes', 0x512c28)
ivory = material('warm eye whites', 0xfff6e6, .65)
blue = material('Ariel blue irises', 0x429bba, .57)
pupil = material('deep blue pupils', 0x173442, .58)
glint = material('small eye catchlight', 0xfff8e8, .55)
gums = material('inner mouth', 0x8d4345)
teeth = material('ivory teeth', 0xffecda)
keep = []
sources = ['GEO-rain-body', 'GEO-rain-head', 'GEO-rain-eyes_viewport',
           'GEO-rain-eyebrows', 'GEO-rain-eyelashes', 'GEO-rain-eye_dots',
           'GEO-rain-gums_upper', 'GEO-rain-gums_lower']
depsgraph = bpy.context.evaluated_depsgraph_get()
for name in sources:
    original = bpy.data.objects[name]
    original.hide_viewport=False
    original.hide_render=False
    original.hide_set(False)
    for modifier in list(original.modifiers):
        if modifier.type in ['MASK','VERTEX_WEIGHT_MIX']:
            original.modifiers.remove(modifier)
            continue
        modifier.show_viewport=True
        modifier.show_render=True
        if modifier.type == 'ARMATURE': modifier.object=rig
        if modifier.type == 'SUBSURF':
            modifier.levels = 1
            modifier.render_levels = 1
    bpy.context.view_layer.update()
    mesh = bpy.data.meshes.new_from_object(original.evaluated_get(depsgraph), depsgraph=depsgraph)
    obj = bpy.data.objects.new('Ariel study — ' + ('body_nomask' if name=='GEO-rain-body' else name.removeprefix('GEO-rain-')), mesh)
    output_collection.objects.link(obj)
    obj.matrix_world = original.matrix_world.copy()
    if name == 'GEO-rain-body':
        bm = bmesh.new(); bm.from_mesh(mesh)
        bmesh.ops.bisect_plane(bm, geom=list(bm.verts)+list(bm.edges)+list(bm.faces),
                              plane_co=(0, 0, .904), plane_no=(0, 0, 1),
                              clear_inner=True, clear_outer=False)
        if any(abs(v.co.z-.904)<.00001 and abs(v.co.x)>.18 for v in bm.verts):
            raise RuntimeError('A posed hand crosses the waist cut; refit the arm')
        bm.to_mesh(mesh); bm.free()
    old_materials = list(mesh.materials)
    material_indices = [p.material_index for p in mesh.polygons]
    mesh.materials.clear()
    if name.endswith(('body', 'head')):
        mesh.materials.append(skin)
        color = mesh.color_attributes.new(name='Pigment', type='FLOAT_COLOR', domain='POINT')
        for vertex in mesh.vertices:
            x, y, z = vertex.co
            base = Vector(linear(0xf3c6a9))
            if name.endswith('head'):
                # A narrower soft jaw and less heavy lower cheeks, retaining
                # the artist's complete mouth, nose, eyelids and ear topology.
                jaw = math.exp(-((z-1.355)/.070)**2)*max(0,min(1,(z-1.325)/.025))
                vertex.co.x *= 1-.095*jaw
                cheek = math.exp(-(((abs(x)-.068)/.038)**2 + ((z-1.428)/.033)**2))
                front = max(0, min(1, (-y-.05)/.06))
                base = base.lerp(Vector(linear(0xe78b83)), cheek*front*.18)
                lip = math.exp(-((x/.039)**4 + ((z-1.393)/.014)**4))*front
                base = base.lerp(Vector(linear(0xd97876)), lip*.72)
            color.data[vertex.index].color = (*base, 1)
        for face in mesh.polygons: face.material_index = 0
    elif name.endswith('eyes_viewport'):
        for mat in old_materials:
            mesh.materials.append(blue if 'blue' in mat.name else pupil if 'black' in mat.name else ivory)
        for face,index in zip(mesh.polygons,material_indices): face.material_index=index
    elif name.endswith('eyebrows'):
        mesh.materials.append(red)
        # Narrow the artist's graphic eyebrows to Ariel's light arched brows.
        for vertex in mesh.vertices:
            x, y, z = vertex.co
            arch = 1.514 + .010*math.sin(min(1,abs(x)/.095)*math.pi)
            vertex.co.z = arch + (z-arch)*.52
    elif name.endswith('eyelashes'): mesh.materials.append(lash)
    elif name.endswith('eye_dots'): mesh.materials.append(glint)
    else:
        for mat in old_materials: mesh.materials.append(teeth if 'teeth' in mat.name else gums)
        for face,index in zip(mesh.polygons,material_indices): face.material_index=index
    for face in mesh.polygons: face.use_smooth = True
    keep.append(obj)

# Build and fuse an original Ariel scalp, forelock and flowing length. The
# resulting hair is one volume, with no cap edge or intersecting rear insert.
def flowing_hair(points,radii):
    positions=[];faces=[];rows=96;sides=48
    def sample(t):
        k=min(len(points)-2,int(t*(len(points)-1)));u=t*(len(points)-1)-k
        p0=Vector(points[max(0,k-1)]);p1=Vector(points[k]);p2=Vector(points[k+1]);p3=Vector(points[min(len(points)-1,k+2)])
        return .5*((2*p1)+(-p0+p2)*u+(2*p0-5*p1+4*p2-p3)*u*u+(-p0+3*p1-3*p2+p3)*u*u*u)
    for row in range(rows+1):
        t=row/rows;c=sample(t);tangent=(sample(min(1,t+.001))-sample(max(0,t-.001))).normalized()
        normal=Vector((-tangent.y,tangent.x,0)).normalized()
        k=min(len(radii)-2,int(t*(len(radii)-1)));a=t*(len(radii)-1)-k;r=radii[k]*(1-a)+radii[k+1]*a
        for side in range(sides):
            angle=side/sides*math.tau
            p=c+normal*(math.cos(angle)*r)+Vector((0,0,math.sin(angle)*r*.64))
            positions.append((p.x,-p.z,p.y))
            if row<rows:
                n=row*sides+side;b=row*sides+(side+1)%sides
                faces.extend([(n,b,n+sides),(b,b+sides,n+sides)])
    faces.extend([tuple(reversed(range(sides))),tuple(rows*sides+s for s in range(sides))])
    mesh=bpy.data.meshes.new('flowing red hair source');mesh.from_pydata(positions,[],faces);mesh.update()
    obj=bpy.data.objects.new('flowing red hair source',mesh);output_collection.objects.link(obj);return obj

# A complete closed-thickness scalp, rather than the source rig's thin hair cards.
positions=[];faces=[];rows=52;sides=96
for row in range(rows+1):
    for side in range(sides):
        angle=side/sides*math.tau;front=math.sin(angle)
        blend=max(0,min(1,(front+.2)/.85));blend=blend*blend*(3-2*blend)
        low=1.230+(1.565-1.230)*blend;y=low+(1.698-low)*row/rows
        lower=max(0,min(1,(1.44-y)/.21))
        dome=math.sqrt(max(.00001,1-((max(1.44,y)-1.50)/.198)**2))*(1-.35*lower)
        x=.11*lower+math.cos(angle)*.160*dome
        z=-.012-.06*lower+math.sin(angle)*.150*dome
        positions.append((x,-z,y))
        if row<rows:
            n=row*sides+side;b=row*sides+(side+1)%sides
            faces.extend([(n,b,n+sides),(b,b+sides,n+sides)])
mesh=bpy.data.meshes.new('fitted Ariel scalp source');mesh.from_pydata(positions,[],faces);mesh.update()
cap=bpy.data.objects.new('fitted Ariel scalp source',mesh);output_collection.objects.link(cap)
bpy.ops.object.select_all(action='DESELECT');cap.select_set(True);bpy.context.view_layer.objects.active=cap
solid=cap.modifiers.new('closed thickness beneath the flowing hair','SOLIDIFY');solid.thickness=.020;solid.offset=0
bpy.ops.object.modifier_apply(modifier=solid.name)
hair_objects=[cap]
hair_objects.append(flowing_hair([[0,1.56,-.075],[.035,1.41,-.12],[.13,1.24,-.14],[.33,1.15,-.12],[.51,1.22,-.07],[.59,1.31,-.035]],
                               [.130,.135,.135,.117,.063,.003]))
hair_objects.append(flowing_hair([[.105,1.58,.065],[.035,1.65,.095],[-.08,1.65,.095],[-.145,1.57,.10],[-.13,1.515,.055]],
                               [.03,.045,.06,.04,.002]))
bpy.ops.object.select_all(action='DESELECT')
for obj in hair_objects:obj.select_set(True)
bpy.context.view_layer.objects.active=hair_objects[0];bpy.ops.object.join()
hair=hair_objects[0];hair.name='Ariel unified sculpted red hair'
remesh=hair.modifiers.new('connected flowing hair volume','REMESH');remesh.mode='VOXEL';remesh.voxel_size=.003
remesh.use_smooth_shade=True;bpy.ops.object.modifier_apply(modifier=remesh.name)
smooth=hair.modifiers.new('soften joined locks','SMOOTH');smooth.factor=.65;smooth.iterations=5;bpy.ops.object.modifier_apply(modifier=smooth.name)
decimate=hair.modifiers.new('compact curved hair','DECIMATE');decimate.ratio=.55;bpy.ops.object.modifier_apply(modifier=decimate.name)
hair.data.materials.clear();hair.data.materials.append(material('Ariel red hair',0xc32e22))
for face in hair.data.polygons:face.use_smooth=True
keep.append(hair)

bpy.ops.object.select_all(action='DESELECT')
for obj in keep: obj.select_set(True)
bpy.context.view_layer.objects.active = keep[0]
print('ARM POSE', list(rig.pose.bones['FK-Hand.L'].head), list(rig.pose.bones['DEF-Hand.L'].head))
bpy.ops.export_scene.gltf(filepath=str(destination), export_format='GLB',
                          use_selection=True, export_animations=False,
                          export_yup=True, export_extras=False,
                          export_all_vertex_colors=True)
print('EXPORTED', destination)
