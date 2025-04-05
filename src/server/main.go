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

	registerHandlers()

	fmt.Printf("Starting XRAYUI Backend Server on port %d\n", port)

	if err := http.ListenAndServe(fmt.Sprintf(":%d", port), nil); err != nil {
		log.Fatalf("Could not start server: %v\n", err)
	}
}

func registerHandlers() {
	http.HandleFunc("/pulse", handlers.PulseHandler)
	http.HandleFunc("/config.json", handlers.XrayConfigHandler)
}
