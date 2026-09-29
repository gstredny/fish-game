# Renders the realistic ocean backdrop as a 360-degree underwater panorama, so it wraps seamlessly while the
# fish swims. Sand dunes with caustic light, rocks fading into blue haze, light shafts from the surface.
#   blender -b -P tools/render-ocean.py -- art/ocean.webp [width height samples]
import math
import random
import sys

import bpy

args = sys.argv[sys.argv.index("--") + 1:]
OUT = args[0]
WIDTH, HEIGHT, SAMPLES = (int(value) for value in args[1:4]) if len(args) >= 4 else (4800, 800, 160)
random.seed(7)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
preferences = bpy.context.preferences.addons["cycles"].preferences
preferences.compute_device_type = "METAL"
preferences.get_devices()
for device in preferences.devices:
    device.use = True
scene.cycles.device = "GPU"
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = True
scene.cycles.volume_step_rate = 4
scene.render.resolution_x, scene.render.resolution_y = WIDTH, HEIGHT
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "WEBP"
scene.render.image_settings.quality = 78
scene.view_settings.view_transform = "Standard"
scene.view_settings.exposure = 0.35


def material(name, build):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    build(mat.node_tree.nodes, mat.node_tree.links, mat.node_tree.nodes["Principled BSDF"])
    return mat


# Above the water: bright surface light. The water itself is a box of scattering, absorbing volume
# (an unbounded world volume would swallow the sunlight before it reached the sand).
world = bpy.data.worlds.new("Surface light")
scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.3, 0.72, 0.85, 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.7


def water_nodes(nodes, links, bsdf):
    nodes.remove(bsdf)
    scatter = nodes.new("ShaderNodeVolumeScatter")
    scatter.inputs["Color"].default_value = (0.1, 0.6, 0.82, 1)
    scatter.inputs["Density"].default_value = 0.045
    scatter.inputs["Anisotropy"].default_value = 0.65
    absorb = nodes.new("ShaderNodeVolumeAbsorption")
    absorb.inputs["Color"].default_value = (0.18, 0.62, 0.8, 1)
    absorb.inputs["Density"].default_value = 0.04
    water = nodes.new("ShaderNodeAddShader")
    links.new(scatter.outputs[0], water.inputs[0])
    links.new(absorb.outputs[0], water.inputs[1])
    links.new(water.outputs[0], nodes["Material Output"].inputs["Volume"])


def sand_nodes(nodes, links, bsdf):
    coords = nodes.new("ShaderNodeTexCoord")
    ripples = nodes.new("ShaderNodeTexWave")
    ripples.inputs["Scale"].default_value = 1.4
    ripples.inputs["Distortion"].default_value = 6
    links.new(coords.outputs["Object"], ripples.inputs["Vector"])
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.35
    links.new(ripples.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    # Caustics: bright wavy lines where sunlight focuses through the surface.
    caustic = nodes.new("ShaderNodeTexVoronoi")
    caustic.feature = "DISTANCE_TO_EDGE"
    caustic.inputs["Scale"].default_value = 0.7
    warp = nodes.new("ShaderNodeTexNoise")
    warp.inputs["Scale"].default_value = 1.6
    mix_coords = nodes.new("ShaderNodeMix")
    mix_coords.data_type = "VECTOR"
    mix_coords.inputs["Factor"].default_value = 0.3
    links.new(coords.outputs["Object"], mix_coords.inputs["A"])
    links.new(warp.outputs["Color"], mix_coords.inputs["B"])
    links.new(mix_coords.outputs["Result"], caustic.inputs["Vector"])
    lines = nodes.new("ShaderNodeMapRange")
    lines.inputs["From Min"].default_value = 0.0
    lines.inputs["From Max"].default_value = 0.02
    lines.inputs["To Min"].default_value = 1.0
    lines.inputs["To Max"].default_value = 0.0
    links.new(caustic.outputs["Distance"], lines.inputs["Value"])
    color = nodes.new("ShaderNodeMix")
    color.data_type = "RGBA"
    color.inputs["A"].default_value = (0.5, 0.45, 0.32, 1)
    color.inputs["B"].default_value = (0.62, 0.57, 0.42, 1)
    links.new(lines.outputs["Result"], color.inputs["Factor"])
    links.new(color.outputs["Result"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.95


def rock_nodes(nodes, links, bsdf):
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 3
    tint = nodes.new("ShaderNodeMix")
    tint.data_type = "RGBA"
    tint.inputs["A"].default_value = (0.06, 0.1, 0.08, 1)
    tint.inputs["B"].default_value = (0.18, 0.26, 0.16, 1)
    links.new(noise.outputs["Fac"], tint.inputs["Factor"])
    links.new(tint.outputs["Result"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.85


def surface_nodes(nodes, links, bsdf):
    # Only casts shadows: gaps in it let light shafts through the water.
    coords = nodes.new("ShaderNodeTexCoord")
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 0.3
    noise.inputs["Detail"].default_value = 3
    links.new(coords.outputs["Object"], noise.inputs["Vector"])
    gaps = nodes.new("ShaderNodeMapRange")
    gaps.inputs["From Min"].default_value = 0.43
    gaps.inputs["From Max"].default_value = 0.46
    links.new(noise.outputs["Fac"], gaps.inputs["Value"])
    links.new(gaps.outputs["Result"], bsdf.inputs["Alpha"])


bpy.ops.mesh.primitive_grid_add(x_subdivisions=500, y_subdivisions=500, size=320)
sand = bpy.context.object
dunes = bpy.data.textures.new("Dunes", "CLOUDS")
dunes.noise_scale = 14
displace = sand.modifiers.new("Dunes", "DISPLACE")
displace.texture = dunes
displace.strength = 2.2
sand.data.materials.append(material("Sand", sand_nodes))

rock_material = material("Rock", rock_nodes)
lumps = bpy.data.textures.new("Lumps", "CLOUDS")
lumps.noise_scale = 1.3
for index in range(34):
    angle = random.uniform(0, math.tau)
    distance = random.uniform(9, 70)
    size = random.uniform(0.8, 3.6) * (1 + distance / 60)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=5, radius=size,
        location=(math.cos(angle) * distance, math.sin(angle) * distance, size * random.uniform(-0.1, 0.35)))
    rock = bpy.context.object
    rock.scale = (random.uniform(0.8, 1.5), random.uniform(0.8, 1.5), random.uniform(0.45, 0.9))
    lump = rock.modifiers.new("Lumps", "DISPLACE")
    lump.texture = lumps
    lump.strength = size * 0.3
    rock.data.materials.append(rock_material)
    bpy.ops.object.shade_smooth()

bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 7))
water = bpy.context.object
water.scale = (320, 320, 18)
water.data.materials.append(material("Water", water_nodes))

bpy.ops.mesh.primitive_plane_add(size=400, location=(0, 0, 16.5))
surface = bpy.context.object
surface.data.materials.append(material("Surface", surface_nodes))
surface.visible_camera = False
surface.visible_diffuse = False
surface.visible_glossy = False
surface.visible_transmission = False
surface.visible_volume_scatter = False

bpy.ops.object.light_add(type="SUN", rotation=(math.radians(14), math.radians(6), 0))
sun = bpy.context.object
sun.data.energy = 12
sun.data.angle = math.radians(2)
sun.data.color = (0.9, 1.0, 0.95)

# A 360-degree strip: its left and right edges meet, so the game can scroll it forever.
bpy.ops.object.camera_add(location=(0, 0, 3.2), rotation=(math.radians(90), 0, 0))
camera = bpy.context.object
camera.data.type = "PANO"
camera.data.panorama_type = "EQUIRECTANGULAR"
camera.data.latitude_min = math.radians(-14)
camera.data.latitude_max = math.radians(36)
camera.data.longitude_min = -math.pi
camera.data.longitude_max = math.pi
scene.camera = camera

scene.render.filepath = OUT
bpy.ops.render.render(write_still=True)
print("RENDERED", OUT)
