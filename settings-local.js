/*
  Provides a hook for mutating settings.js, primarily for users of Halyard.

  e.g.,
  window.spinnakerSettings.defaultInstancePort = 8080;
*/

// Turn off ability to edit AWS Security Groups - not doing this in Halyard
// until we stabilize (also would need to PR Halyard)
window.spinnakerSettings.securityGroupsReadOnly = true;
