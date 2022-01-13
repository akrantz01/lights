using Go = import "go.capnp";
@0xd91d0c9586c33e4f;

$Go.package("lights");
$Go.import("github.com/akrantz01/lights/lights-web/lights");

struct Color @0xb3f078772ec8e414 {
  # An RGB color with values in the range 0-255 inclusive

  r @0 :UInt8;
  g @1 :UInt8;
  b @2 :UInt8;
}

struct Position @0x918e03b05c690a3b {
  # The position of a pixel to set. The position can be an individual point,
  # range of points, or a list of points.

  union {
    single @0 :UInt16;
    range :group {
      start @1 :UInt16;
      end @2 :UInt16;
    }
    list @3 :List(UInt16);
  }
}

enum Mode @0xdf03095de4d6a4a3 {
  # Whether to queue successive changes, requiring an explicit call to `write`,
  # or instantly show the changes.

  queue @0;
  instant @1;
}

interface LightController @0xb169ce07794d2b2f {
  # Controls an individual strip of NeoPixels

  set @0 (position: Position, color: Color);
  # Set the color of one or many pixels

  fill @1 (color: Color);
  # Fill the entire strip with the given color. Equivalent to setting a range from
  # the start to end as a single color.

  brightness @2 (level: UInt8);
  # Set the brightness of the strip. Only values 0-100 inclusive are accepted.

  mode @3 (mode: Mode);
  # Set the display mode for the strip.

  show @4 ();
  # Write any queued changes to the strip. This is a no-op if the mode is set to instant.
}
