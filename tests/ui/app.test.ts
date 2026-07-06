// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from "vitest";
import axe from "axe-core";

describe("browser app",()=>{
  beforeAll(async()=>{document.documentElement.lang="en";document.title="LLM Gladiator Arena";document.body.innerHTML='<div id="app"></div>';localStorage.clear();await import("../../src/main");});
  it("renders and simulates the sample battle",()=>{expect(document.querySelectorAll(".cell")).toHaveLength(49);(document.querySelector("#simulate") as HTMLButtonElement).click();expect(document.querySelector("#log")?.textContent).toContain("Round 1 begins");expect((document.querySelector("#carry") as HTMLButtonElement).disabled).toBe(false);});
  it("has no serious automated accessibility violations",async()=>{const result=await axe.run(document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa"]},rules:{"color-contrast":{enabled:false}}});expect(result.violations.filter(v=>["serious","critical"].includes(v.impact??""))).toEqual([]);});
});
