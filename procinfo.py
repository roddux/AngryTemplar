import frida, sys

pid = int(sys.argv[1])
session = frida.attach(pid)

scriptFile = "procinfo.js"
scriptData = open(scriptFile, "r").read()

funcDump = session.create_script(scriptData)
funcDump.load()
funcDump.exports.enumerate_imports()
