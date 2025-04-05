package handlers

import (
	"net/http"
	"os"
	"xrayui/engine"
)

func XrayConfigHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}
	settings := engine.GetSettings()

	filePath := settings.XrayConfigPath

	data, err := os.ReadFile(filePath)
	if err != nil {
		errMsg := "Error reading config file " + filePath + ": " + err.Error()
		http.Error(w, errMsg, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(data)
}
