package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"xrayui/actions"
)

func ActionHandler(w http.ResponseWriter, r *http.Request) {

	action := r.Header.Get("XRAYUI-Action")
	if action == "" {
		http.Error(w, "Missing XRAYUI-Action header", http.StatusBadRequest)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	log.Println("Received action:", action)

	switch action {
	case "xrayui_serverstatus_stop":
		actions.StopXrayAction()
		respondJSON(w, map[string]string{"status": "mode set"})
	default:
		http.Error(w, "Unknown action", http.StatusBadRequest)
	}
}

// Helper function to respond with JSON.
func respondJSON(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(data); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
