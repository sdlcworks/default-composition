import {expect,test} from "bun:test";
test("Cloudflare bucket allocations authenticate with scoped providers",()=>{
 const result=Bun.spawnSync([process.execPath,"test",`${import.meta.dir}/fixtures/cloudflare-allocation.fixture.ts`],{cwd:import.meta.dir,stdout:"pipe",stderr:"pipe"});
 expect(result.exitCode, new TextDecoder().decode(result.stderr)).toBe(0);
});
