package handlers

import (
	"net/http"
	"os"
)

func ServeStaticFile(filePath, contentType string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		data, err := os.ReadFile(filePath)
		if err != nil {
			errMsg := "Error reading file " + filePath + ": " + err.Error()
			http.Error(w, errMsg, http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", contentType)
		w.WriteHeader(http.StatusOK)
		w.Write(data)
	}
}
