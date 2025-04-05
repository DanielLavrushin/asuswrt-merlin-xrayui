package engine

type XrayUiSettings struct {
	XrayConfigPath    string `json:"xrayConfigPath"`
	StaticIndexPath   string `json:"staticIndexPath"`
	StaticJsPath      string `json:"staticJsPath"`
	AsusMainStylePath string `json:"asusMainStylePath"`
	AsusFormStylePath string `json:"asusFormStylePath"`
}

var settings XrayUiSettings

func GetSettings() XrayUiSettings {
	return settings
}
