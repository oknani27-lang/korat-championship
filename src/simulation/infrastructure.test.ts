import assert from 'node:assert/strict'
import { Bone, Box3, BoxGeometry, Float32BufferAttribute, Group, Mesh, MeshStandardMaterial, Skeleton, SkinnedMesh, Texture, Uint16BufferAttribute, Vector3 } from 'three'
import { createModelInstance } from './model.ts'
import { createMaterialController } from './materials.ts'
import { focusBounds } from './camera.ts'
import { flowProgress, inactiveVisuals, processVisuals } from './visual-state.ts'
import { parseFlows, parseModelTransform, parseParts, parseSteps } from '../data/parse.ts'

// Generic software fixture only. These nodes do not represent DMR equipment.
const source = new Group(), moduleA = new Group(), geometry = new BoxGeometry(), texture = new Texture()
moduleA.name = 'ModuleA'; moduleA.position.set(4, 1, 0)
const original = new MeshStandardMaterial({ color: '#778899', map: texture })
const shell = new Mesh(geometry, original); shell.name = 'Shell'
const insert = new Mesh(geometry, original); insert.name = 'Insert'; insert.scale.setScalar(0.3)
const extra = new Mesh(geometry, original); extra.name = 'Extra'; extra.position.set(6, 1, 0)
moduleA.add(shell, insert); source.add(moduleA, extra)
const parts = parseParts([{id:'a',nodeName:'ModuleA',nodeNames:['Extra'],xrayNodeNames:['Shell'],label:'Generic A',focus:null},{id:'b',nodeName:'Insert',label:'Generic B',focus:null}])
const model = createModelInstance(source, parts)
assert.equal(model.parts.get('a')?.objects.length,2)
assert.equal(model.parts.get('a')?.meshes.length,2)
assert.equal(model.partFor(model.nodes.get('Insert')![0])?.definition.id,'b')
assert.deepEqual(model.issues,[])
assert.equal(model.root.children[0].children[0].name,'ModuleA')
assert.deepEqual(source.children[0].position.toArray(),[4,1,0])
assert.deepEqual(new Box3().setFromObject(model.root).min.toArray(),new Box3().setFromObject(source).min.toArray())
const normalized = createModelInstance(source,parts,{fitSize:2,center:true})
const bounds = new Box3().setFromObject(normalized.root)
assert(bounds.getCenter(new Vector3()).length()<1e-8)
assert(Math.abs(Math.max(...bounds.getSize(new Vector3()).toArray())-2)<1e-8)
assert.throws(()=>parseModelTransform({scale:0}))
assert.throws(()=>parseModelTransform({scale:2,fitSize:2}))
assert.throws(()=>parseModelTransform({center:'yes'}))
assert.throws(()=>createModelInstance(new Group(),[]))
assert.throws(()=>parseParts([{...parts[0],nodeNames:12}]))
assert.throws(()=>parseParts([{...parts[0],nodeNames:['ModuleA']}]))
const missing=createModelInstance(source,[{...parts[0],nodeNames:['Missing']}])
assert.deepEqual(missing.issues,[{partId:'a',nodeName:'Missing'}])
const duplicate = source.clone(); const duplicateNode=new Group();duplicateNode.name='ModuleA';duplicate.add(duplicateNode)
assert.equal(createModelInstance(duplicate,parts).issues[0].reason,'ambiguous')
assert.equal(createModelInstance(source,[{...parts[0],xrayNodeNames:['Insert']},parts[1]]).issues[0].reason,'conflict')
const materials=createMaterialController(model), clonedShell=model.nodes.get('Shell')![0] as Mesh
const clonedInsert=model.nodes.get('Insert')![0] as Mesh
const normal={selectedPartId:null,hoveredPartId:null,activePartIds:[],xrayPartIds:[]}
assert.equal(materials.apply(normal),false)
materials.apply({...normal,hoveredPartId:'a'})
assert.notEqual(clonedShell.material,original);assert.equal(shell.material,original)
assert.equal(original.color.getHexString(),'778899')
materials.apply({...normal,selectedPartId:'b',hoveredPartId:'b',activePartIds:['b']})
assert.equal((clonedInsert.material as MeshStandardMaterial).color.getHexString(),'45c5ed')
materials.apply({...normal,hoveredPartId:'b',activePartIds:['b']})
assert.equal((clonedInsert.material as MeshStandardMaterial).color.getHexString(),'a9dce8')
materials.apply({...normal,activePartIds:['b']})
assert.equal((clonedInsert.material as MeshStandardMaterial).color.getHexString(),'7cc8d4')
materials.apply({...normal,selectedPartId:'b',activePartIds:['b'],xrayPartIds:['a']})
assert.equal((clonedShell.material as MeshStandardMaterial).opacity,0.18)
assert.equal((clonedInsert.material as MeshStandardMaterial).transparent,false)
assert.notEqual(clonedShell.raycast,shell.raycast)
const other=createModelInstance(source,parts)
assert.equal((other.nodes.get('Shell')![0] as Mesh).material,original)
const allocated=materials.ownedMaterialCount
for(let i=0;i<100;i++){materials.apply({...normal,selectedPartId:i%2?'a':'b',xrayPartIds:i%2?['a']:[]});materials.apply(normal)}
assert.equal(materials.ownedMaterialCount,allocated)
assert.equal(clonedShell.material,original);assert.equal(clonedShell.raycast,shell.raycast)
let sourceDisposed=0;original.addEventListener('dispose',()=>sourceDisposed++)
materials.apply({...normal,xrayPartIds:['a']})
materials.dispose();materials.dispose();assert.equal(materials.ownedMaterialCount,0);assert.equal(sourceDisposed,0)
assert.equal(clonedShell.material,original);assert.equal(clonedShell.raycast,shell.raycast)
assert.equal((clonedShell.material as MeshStandardMaterial).map,texture)
// StrictMode's effect cleanup/setup may reuse a prepared instance.
materials.apply({...normal,selectedPartId:'a'});assert(materials.ownedMaterialCount>0);materials.dispose()
const skinGeometry=new BoxGeometry(),count=skinGeometry.attributes.position.count
skinGeometry.setAttribute('skinIndex',new Uint16BufferAttribute(new Uint16Array(count*4),4))
const weights=new Float32BufferAttribute(new Float32Array(count*4),4)
for(let i=0;i<count;i++)weights.setX(i,1)
skinGeometry.setAttribute('skinWeight',weights)
const rig=new Group(),skin=new SkinnedMesh(skinGeometry,original),bone=new Bone()
skin.name='GenericSkin';skin.add(bone);skin.bind(new Skeleton([bone]));rig.add(skin);rig.updateMatrixWorld(true)
skin.skeleton.computeBoneTexture();let sourceBoneDisposed=0;skin.skeleton.boneTexture!.addEventListener('dispose',()=>sourceBoneDisposed++)
const rigInstance=createModelInstance(rig,[]),clonedSkin=rigInstance.nodes.get('GenericSkin')![0] as SkinnedMesh
assert.notEqual(clonedSkin.skeleton,skin.skeleton);clonedSkin.skeleton.computeBoneTexture();rigInstance.dispose()
assert.equal(clonedSkin.skeleton.boneTexture,null);assert.equal(sourceBoneDisposed,0);skin.skeleton.dispose();skinGeometry.dispose()
const pose=focusBounds(bounds,35,1,new Vector3(1,1,1),2.8,12)!
assert(new Vector3(...pose.target).length()<1e-8);assert(new Vector3(...pose.position).length()>=2.8)
assert.equal(focusBounds(new Box3(),35,1,new Vector3(),2.8,12),null)
assert.equal(focusBounds(bounds,0,1,new Vector3(),2.8,12),null)
assert.equal(focusBounds(bounds,35,NaN,new Vector3(),2.8,12),null)
const paths=parseFlows([{id:'p',partIds:[],points:[[0,0,0],[1,0,0]],phase:{start:0.25,end:0.75}},{id:'q',partIds:[],points:[[0,0,0],[0,1,0]],direction:'reverse'}])
assert.equal(flowProgress(paths[0],0.1),null);assert.equal(flowProgress(paths[0],0.5),0.5)
assert.equal(flowProgress(paths[1],0.2),0.8);assert(Math.abs(flowProgress(paths[1],0.9)!-0.1)<1e-10)
assert.equal(flowProgress(paths[1],0),1);assert.equal(flowProgress(paths[1],1),0)
assert.equal(flowProgress(paths[0],0.25),0);assert.equal(flowProgress(paths[0],0.75),1);assert.equal(flowProgress(paths[0],1),null)
assert.throws(()=>parseFlows([{...paths[0],points:[[0,0,0]]}]))
assert.throws(()=>parseFlows([{...paths[0],points:[[0,0,0],[0,0,0]]}]))
assert.throws(()=>parseFlows([{...paths[0],phase:{start:1,end:1}}]))
const step=parseSteps([{id:'ui',title:'UI fixture',subtitle:'',description:'',formulas:[],outputs:[],activeParts:['b'],flowPaths:['p'],activeXrayParts:[],cameraFocus:null,timeline:{start:0,end:1,phases:[{id:'first',start:0,end:0.5,activeXrayParts:['a'],effectIds:['reserved']},{id:'second',start:0.5,end:1,flowPaths:['q']}]}}])[0]
assert.deepEqual(processVisuals(step,0.25,true).xrayPartIds,['a'])
assert.deepEqual(processVisuals(step,0.75,true).flowPathIds,['p','q'])
assert.deepEqual(processVisuals(step,0.25,true).phaseIds,['first'])
assert.deepEqual(processVisuals(step,1,true).phaseIds,['second'])
assert.equal(processVisuals(step,0.5,false),inactiveVisuals)
assert.throws(()=>parseSteps([{...step,timeline:{start:0,end:1,phases:[{id:'bad',start:0,end:1,flowPaths:12}]}}]))
geometry.dispose();original.dispose();texture.dispose()
console.log('PASS: model normalization/registry, isolated materials, camera bounds, deterministic phases and multiple flows')

