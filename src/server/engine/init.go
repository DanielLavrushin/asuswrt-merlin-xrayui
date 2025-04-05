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
	} else {
		settings.XrayConfigPath = "/opt/etc/xray/config.json"
	}
}
