# How to Build

## Install Openwrt

### 1. Install Build essentials
```sh
sudo apt install build-essential clang flex bison g++ gawk \
gcc-multilib g++-multilib gettext git libncurses5-dev libssl-dev \
python3-setuptools rsync swig unzip zlib1g-dev file wget
```

### 2. Clone openwrt
```sh
git clone https://git.openwrt.org/openwrt/openwrt.git
cd openwrt
git checkout v23.05.3
make distclean
./scripts/feeds update -a
./scripts/feeds install -a
make menuconfig
# choose target-system (=qualcomm-ipq4019), subtarget (=generic), target-profile (=linksys_ea8300)
# choose target-system (=mediatek-ralink-mips), subtarget (=mt7621), target-profile (=asus-rt-ax53u)
make toolchain/install
```

### 3. Link the project
```sh
git clone git@github.com:mehdi-behrooz/freiheit-openwrt.git
cd freiheit-openwrt/
echo "src-link freiheit $PWD" >~/openwrt/feeds.conf
~/openwrt/scripts/feeds update freiheit
~/openwrt/scripts/feeds list                      # packages should be listed here
ls -l ~/openwrt/feeds/freiheit                    # soft links should have been created from the source folder into feeds/freiheit/
~/openwrt/scripts/feeds install -a -p freiheit
ls -l ~/openwrt/package/feeds/freiheit/           # soft links should have been created from feeds/freiheit/ to package/feeds/freiheit/
make menuconfig -C ~/openwrt
# mark the package: LuCI > luci-app-freiheit
make package/luci-app-freiheit/compile -C ~/openwrt
find ~/openwrt/ -ipath '*/freiheit/luci-app-freiheit*.ipk' -exec scp {} wrt:ipk \; -exec ssh wrt opkg install --force-reinstall ipk/luci-app-freiheit*.ipk \;

```


