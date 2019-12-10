/// <reference path="../../lib/three.d.ts" />
/// <reference path="../model/model.ts" />
/// <reference path="item.ts" />
/// <reference path="metadata.ts" />

module BP3D.Items {
  /**
   * A Floor Item is an entity to be placed related to a floor.
   */
  export abstract class DeviceItem extends Item {
    constructor(model: Model.Model, metadata: Metadata, geometry: THREE.Geometry, material: THREE.MeshFaceMaterial, position: THREE.Vector3, rotation: number, scale: THREE.Vector3) {
      super(model, metadata, geometry, material, position, rotation, scale);

      // console.log('=====> DeviceItem');
    };

    /** */
    public placeInRoom() {
      if (!this.position_set) {
        var center = this.model.floorplan.getCenter();
        this.position.x = center.x;
        this.position.z = center.z;
        this.position.y = 0.5 * (this.geometry.boundingBox.max.y - this.geometry.boundingBox.min.y);
      }
    };

    /** Take action after a resize */
    public resized() {
    }

    /** */
    public moveToPosition(vec3, intersection) {
      // keeps the position in the room and on the floor
      if (!this.isValidPosition(vec3)) {
        this.showError(vec3);
        return;
      } else {
        this.hideError();
        vec3.y = this.position.y; // keep it on the floor!
        this.position.copy(vec3);
      }
    }

    /** */
    public isValidPosition(vec3): boolean {
      var corners = this.getCorners('x', 'z', vec3);

      // check if we are in a room
      var rooms = this.model.floorplan.getRooms();
      var isInARoom = false;
      for (var i = 0; i < rooms.length; i++) {
        if (Core.Utils.pointInPolygon(vec3.x, vec3.z, rooms[i].interiorCorners) &&
          !Core.Utils.polygonPolygonIntersect(corners, rooms[i].interiorCorners)) {
          isInARoom = true;
        }
      }
      if (!isInARoom) {
        //console.log('object not in a room');
        return false;
      }

      // check if we are in a space
      this.spaceCheck();

      return true;
    }

    spaceCheck() {
      const items = this.model.scene.getItems();

      this.position.y = 0.5 * (this.geometry.boundingBox.max.y - this.geometry.boundingBox.min.y);

      for (var i = 0; i < items.length; i++) {
        if (this.uuid !== items[i].uuid) {
          const positions = {
            selected: {
              x: {
                start: this.position.x - this.halfSize.x,
                end: this.position.x + this.halfSize.x
              },
              z: {
                start: this.position.z + this.halfSize.z,
                end: this.position.z - this.halfSize.z
              }
            },
            other: {
              x: {
                start: items[i].position.x - items[i].halfSize.x,
                end: items[i].position.x + items[i].halfSize.x
              },
              z: {
                start: items[i].position.z + items[i].halfSize.z,
                end: items[i].position.z - items[i].halfSize.z
              }
            }
          };

          const itemInterval = {
            from: (positions.selected.x.start < positions.other.x.end && positions.selected.x.end > positions.other.x.start),
            to: (positions.selected.z.start > positions.other.z.end && positions.selected.z.end < positions.other.z.start)
          };

          if (itemInterval.from && itemInterval.to) {
            this.position.y = items[i].position.y + items[i].getHeight();
          }
        }
      }
    }
  }
}
