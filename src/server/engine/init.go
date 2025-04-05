package engine

import (
	"fmt"
	"os"
	"path/filepath"
)

func InitEnvironment(devmode bool) {
	fmt.Println("Initializing environment...")

	if devmode {
		fmt.Println("Debug mode enabled")

		wd, _ := os.Getwd()

		settings.XrayConfigPath = filepath.Join(wd, "./debug/opt/etc/xray/config.json")
		settings.StaticIndexPath = filepath.Join(wd, "./../../dist/frontend/standalone.html")
		settings.StaticJsPath = filepath.Join(wd, "./../../dist/frontend/app.js")
		settings.AsusMainStylePath = filepath.Join(wd, "./../../www/index_style.css")
		settings.AsusFormStylePath = filepath.Join(wd, "./../../www/form_style.css")
	} else {
		settings.XrayConfigPath = "/opt/etc/xray/config.json"
	}
}
