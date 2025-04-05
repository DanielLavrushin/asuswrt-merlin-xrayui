package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"xrayui/engine"
	"xrayui/handlers"
)

var devmode bool
var port int

func main() {

	flag.BoolVar(&devmode, "devmode", false, "Enable developer mode")
	flag.IntVar(&port, "port", 18088, "Port to run the server on")
	flag.Parse()

	wd, err := os.Getwd()
	if err != nil {
		log.Fatalf("Error getting working directory: %v", err)
	}
	fmt.Printf("Working directory: %s\n", wd)
	fmt.Printf("Absolute config path: %s\n", filepath.Join(wd, engine.GetSettings().XrayConfigPath))

	engine.InitEnvironment(devmode)
	settings := engine.GetSettings()
	registerHandlers(settings)

	fmt.Printf("Starting XRAYUI Backend Server on port %d\n", port)

	if err := http.ListenAndServe(fmt.Sprintf(":%d", port), nil); err != nil {
		log.Fatalf("Could not start server: %v\n", err)
	}
}

func registerHandlers(settings engine.XrayUiSettings) {
	http.HandleFunc("/pulse", handlers.PulseHandler)
	http.HandleFunc("/ext/xrayui/xray-config.json", handlers.ServeStaticFile(settings.XrayConfigPath, "text/json"))
	http.HandleFunc("/index.html", handlers.ServeStaticFile(settings.StaticIndexPath, "text/html"))
	http.HandleFunc("/app.js", handlers.ServeStaticFile(settings.StaticJsPath, "text/javascript"))

	http.HandleFunc("/index_style.css", handlers.ServeStaticFile(settings.AsusMainStylePath, "text/css"))
	http.HandleFunc("/form_style.css", handlers.ServeStaticFile(settings.AsusFormStylePath, "text/css"))
}
