// In-memory HTTP fixture for tests only. No DMR machine asset is generated.
export function genericFixture() {
  const corners=[[-.5,-.5,-.5],[.5,-.5,-.5],[.5,.5,-.5],[-.5,.5,-.5],[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]];
  const faces=[0,2,1,0,3,2,4,5,6,4,6,7,0,1,5,0,5,4,3,7,6,3,6,2,1,2,6,1,6,5,0,4,7,0,7,3];
  const data=new Uint8Array(faces.length*12),view=new DataView(data.buffer);faces.flatMap(index=>corners[index]).forEach((n,i)=>view.setFloat32(i*4,n,true));
  return {asset:{version:'2.0',generator:'Generic UI test fixture only'},scene:0,scenes:[{nodes:[0]}],nodes:[
    {name:'GenericAssembly',children:[1,4,5]},
    {name:'ModuleA',translation:[-.5,.8,0],children:[2,3]},
    {name:'ShellA',mesh:0,scale:[1,1.5,1]},
    {name:'InsertB',mesh:0,scale:[.35,.7,.35]},
    {name:'ExtraA',mesh:0,translation:[-1.5,.4,0],scale:[.5,.5,.5]},
    {name:'BoxC',mesh:0,translation:[1.1,.6,0],scale:[.7,.7,.7]},
  ],materials:[{name:'SharedFixtureMaterial',pbrMetallicRoughness:{baseColorFactor:[.5,.6,.65,1],metallicFactor:0,roughnessFactor:.6}}],meshes:[{primitives:[{attributes:{POSITION:0},material:0}]}],buffers:[{uri:'data:application/octet-stream;base64,'+btoa(Array.from(data,byte=>String.fromCharCode(byte)).join('')),byteLength:data.byteLength}],bufferViews:[{buffer:0,byteLength:data.byteLength}],accessors:[{bufferView:0,componentType:5126,count:faces.length,type:'VEC3',min:[-.5,-.5,-.5],max:[.5,.5,.5]}]};
};

