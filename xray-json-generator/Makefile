include $(TOPDIR)/rules.mk

PKG_NAME:=xray-json-generator
PKG_VERSION:=1.0.6
PKG_RELEASE:=1

include $(INCLUDE_DIR)/package.mk

ifeq ($(ARCH),arm)
  SUFFIX:=armv7
else ifeq ($(ARCH),mipsel)
  SUFFIX:=mipsle
else
  SUFFIX:=unknown
endif

SOURCE_URL:=https://github.com/mehdi-behrooz/xray-json-generator/releases/download/v$(PKG_VERSION)/
SOURCE_FILE:=$(PKG_NAME)-v$(PKG_VERSION)-$(SUFFIX).bin

define Package/$(PKG_NAME)
  SECTION:=utils
  CATEGORY:=Utilities
  TITLE:=Xray Json Generator
  URL:=https://github.com/mehdi-behrooz/xray-json-generator
endef

define Package/$(PKG_NAME)/description
	A tool to generate JSON configuration for Xray-core from Xray URI's.
endef

define Build/Prepare
	curl -L $(SOURCE_URL)/$(SOURCE_FILE) -o $(BUILD_DIR)/$(SOURCE_FILE)
endef

define Build/Compile
	# No compilation needed
endef

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(BUILD_DIR)/$(SOURCE_FILE) $(1)/usr/bin/xray-json-generator
endef

$(eval $(call BuildPackage,$(PKG_NAME)))

