include $(TOPDIR)/rules.mk

PKG_NAME:=xray-geosite-iran
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

SOURCE_URL:=https://github.com/chocolate4u/Iran-v2ray-rules/releases/latest/download

include $(INCLUDE_DIR)/package.mk

define Package/$(PKG_NAME)
  SECTION:=utils
  CATEGORY:=Utilities
  TITLE:=Xray GeoIP and GeoSite files for Iran
  PKGARCH:=all
endef

define Package/$(PKG_NAME)/description
  This package provides Xray GeoIP and GeoSite files for Iran.
endef

define Build/Prepare
	curl -L $(SOURCE_URL)/geoip.dat -o $(BUILD_DIR)/geoip.dat
	curl -L $(SOURCE_URL)/geosite.dat -o $(BUILD_DIR)/geosite.dat
endef

define Build/Compile
	# No compilation needed
endef

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/usr/share/xray
	$(INSTALL_DATA) $(BUILD_DIR)/geoip.dat $(1)/usr/share/xray/geoip_ir.dat
	$(INSTALL_DATA) $(BUILD_DIR)/geosite.dat $(1)/usr/share/xray/geosite_ir.dat
endef

$(eval $(call BuildPackage,xray-geosite-iran))
