package auth

type Permission string

const (
	PermissionEditAnimations Permission = "edit:animations"
	PermissionEditPresets               = "edit:presets"
	PermissionEditSchedules             = "edit:schedules"
	PermissionControlLights             = "control:lights"
)

var knownPermissions = []Permission{PermissionEditAnimations, PermissionEditPresets, PermissionEditSchedules, PermissionControlLights}

// Permissions denotes which permissions a given user has
type Permissions map[Permission]bool

// NewPermissions creates a permission check from a list of scopes
func NewPermissions(scopes []string) *Permissions {
	permissions := make(Permissions)

	for _, scope := range scopes {
		for _, permission := range knownPermissions {
			if scope == string(permission) {
				permissions[permission] = true
				break
			}
		}
	}

	return &permissions
}

// Has checks if the permission set has the given permission
func (p *Permissions) Has(permission Permission) bool {
	if p == nil {
		return false
	}

	exists, ok := (*p)[permission]
	return ok && exists
}
