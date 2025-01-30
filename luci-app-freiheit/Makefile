include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-freiheit
PKG_VERSION:=1.0
PKG_RELEASE:=1

LUCI_TITLE:=LuCI Client for Freiheit Project
LUCI_DEPENDS:=+xray-json-generator +xray-geosite-iran
LUCI_EXTRA_DEPENDS:=xray-core, v2ray-geosite, moreutils, jq, kmod-nft-tproxy
LUCI_PKGARCH:=all
LUCI_MINIFY_JS:=1
LUCI_MINIFY_CSS:=1

define Package/${PKG_NAME}/description
LuCI Client for Freiheit Project
endef

define Package/${PKG_NAME}/conffiles
/etc/config/freiheit
endef

define Package/${PKG_NAME}/postinst
#!/bin/sh
>/var/log/freiheit.log
/etc/init.d/rpcd reload
endef

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
