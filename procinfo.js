'use strict';
rpc.exports.enumerateImports = function () {
	Process.enumerateModulesSync().forEach(function(module) {
		console.log("\n    :", module["name"], "imports");
		// Module.ensureInitialized(module["name"]);
		Module.enumerateImports(module["name"],
			{
				"onMatch": function(imp) {
					try { console.log(imp["type"], imp["name"], imp["address"]) } catch (e) {}
				}, "onComplete": function(){}
			}
		);
		console.log("\n    :", module["name"], "exports");
		Module.enumerateExports(module["name"],
			{
				"onMatch": function(sym) {
					try { console.log(sym["type"], sym["name"], sym["address"]) } catch (e) {}
				}, "onComplete": function(){}
			}
		);
		console.log("\n    :", module["name"], "symbols");
		Module.enumerateSymbols(module["name"],
			{
				"onMatch": function(exp) {
					try { console.log(exp["type"], exp["name"], exp["address"]) } catch (e) {}
				}, "onComplete": function(){}
			}
		);
	});
};
