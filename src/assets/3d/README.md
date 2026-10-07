# 3D asset pipeline

Place production models here as Draco-compressed `.glb` files. Load them with Drei's `useGLTF` and `DRACOLoader`, then call `useGLTF.preload("/assets/3d/model.glb")` from the world boot module.

The current world deliberately uses procedural low-poly geometry, which keeps the first playable build small, needs no texture downloads, and lets Three.js frustum-cull individual meshes. Buildings use Drei `Detailed` LOD levels; `Canvas3D` caps device pixel ratio at 1.5 for mobile performance.
