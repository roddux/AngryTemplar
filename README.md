# Frida playground
In-memory fuzzer for a couple of nginx functions. An example setup for how
you can become INTERNET FAMOUS by finding 0days. Additions welcome.

# Setup
## AngryTemplar
- Clone this repository to the current directory:
  `$ git clone git@gitlab.one.arcturus.net:rory.mackie/angry-templar.git .`
- Clone the submodules in one fell swoop:
  `$ git submodule update --init --recursive`
## Frida
- Setup a virtual environment 
  `$ virtualenv -p `which python3` --prompt '[A-T] ' ./venv/`
- Enter the virtual environment
  `$ source venv/bin/activate`
- Install the requirements for AngryTemplar in the virtual environment
  `$ pip install -r requirements.txt`
- Verify Python+Frida are installed and setup correctly
  `$ python
  >>> import frida
  >>>`
## Nginx
- Compile nginx with AddressSanitiser (ASAN)
  `$ cd nginx; mkdir BUILD`
  `$ ./auto/configure --with-prefix=`pwd`/BUILD`
- Copy in the fuzz nginx config
  `$ cp ./nginx.fuzz.conf ./nginx/BUILD/conf/nginx.fuzz.conf`
- Ensure nginx has built correctly and likes our config file
  `$ ./nginx/BUILD/sbin/nginx -c conf/nginx.fuzz.conf -t`
## Radamsa
- Compile radamsa
  `$ cd radamsa; make`
- Test that it has compiled and built correctly
  `$ ./bin/radamsa -V`

# Running AngryTemplar
- In one terminal, run nginx:
  `$ ./nginx/BUILD/sbin/nginx -c conf/nginx.fuzz.conf`
- In another terminal, run prochook.py:
  `$ python prochook.py`
- In another terminal, generate some HTTP requests for the nginx server:
  `$ while true; do curl localhost -s >/dev/null; done`
