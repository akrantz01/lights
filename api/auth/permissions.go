package auth

type Permission string

const (
	PermissionEdit          Permission = "lights-edit"
	PermissionControlLights            = "lights-control"
)

var knownPermissions = []Permission{PermissionEdit, PermissionControlLights}

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

// AsSlice converts the assigned permissions to a string slice for transport
func (p *Permissions) AsSlice() []string {
	var rawPermissions []string
	for permission := range *p {
		rawPermissions = append(rawPermissions, string(permission))
	}

	return rawPermissions
}
