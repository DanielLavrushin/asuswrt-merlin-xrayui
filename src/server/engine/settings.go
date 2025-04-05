package engine

type XrayUiSettings struct {
	XrayConfigPath string `json:"xrayConfigPath"`
}

var settings XrayUiSettings

func GetSettings() XrayUiSettings {
	return settings
}
