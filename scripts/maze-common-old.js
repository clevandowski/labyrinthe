var Labyrinthe = function(windowsWidth, windowsHeight) {
  this.initializing = false;
  this.initialized = false;
  this.generating = false;
  this.generated = false;
  this.resolving = false;
  this.resolved = false;
  this.cellules = [];
  this.width = 50;
  this.height = 50;

  this.init = function() {
    var startTime = Date.now();
    this.initializing = true;
    var wWidth = (windowsWidth * 10 / 29) - 30;
    var nbCellule = parseInt(this.width, 10);
    this.cssSize = (wWidth / nbCellule) - 2;
    if (this.cssSize < 2) this.cssSize = 2;
    console.log("width: " + this.width + ", height: " + this.height + ", cssSize: " + this.cssSize);
    console.log("windowsWidth: " + windowsWidth + ", windowsHeight:" + windowsHeight);
    // console.log("wWidth: " + wWidth + ", nbCellule:" + nbCellule);
    for (var j = 0; j < this.height; j++) {
      this.cellules[j] = [];
      for (var i = 0; i < this.width; i++) {
        this.cellules[j][i] = {
          x: i,
          y: j,
          value: 0xF
        }
      }
    }
    this.resetResolution();
    var endTime = Date.now();
    this.generationInitialization = endTime - startTime;
    console.log("Labyrinthe initialization duration: " + this.generationInitialization + "ms");
    this.initializing = false;
    this.initialized = true;
  }

  this.resetResolution = function() {
    this.celluleStart = null;
    this.celluleEnd = null;

    for (var j = 0; j < this.height; j++) {
      for (var i = 0; i < this.width; i++) {
        this.cellules[j][i].visited = false;
        this.cellules[j][i].nextCelluleToEnd = null;
        this.cellules[j][i].selectedStart = false;
        this.cellules[j][i].selectedEnd = false;
      }
    }
  }

  this.getCssClass = function(cellule) {
    var cssClass = "cellule x" + cellule.value.toString(16).toUpperCase();
    if (cellule.current) {
      cssClass = cssClass + " current";
    }
    if (cellule.selectedStart || cellule.selectedEnd) {
      cssClass = cssClass + " selectionned";
    } else if (cellule.visited) {
      cssClass = cssClass + " visited";
    } else if (cellule.processed) {
      cssClass = cssClass + " processed";
    }
    return cssClass;
  }
}

var app = angular.module('myApp', []);

app.service('resolve', function() {
  // Deprecated
  // Ancienne fonction récursive pour initialiser le chemin en fonction de la sortie
  // Mais ça plante sur des labyrinthes assez gros (ex: 200x200)
  // Remplacé par _setTreeToNoRecursive
  this._setTreeTo = function(cellule, labyrinthe, fromCellule) {
    // S'il y une cellule à gauche
    if (cellule.x > 0
        // Et qu'il y a pas de mur
        && (cellule.value & 0x4) == 0
        // Et que ce n'est pas la cellule d'où on vient
        && fromCellule.x != (cellule.x - 1)) {
          labyrinthe.cellules[cellule.y][cellule.x - 1].nextCelluleToEnd = cellule;
          this._setTreeTo(labyrinthe.cellules[cellule.y][cellule.x - 1], labyrinthe, cellule);
    }
    // S'il y une cellule à droite
    if (cellule.x < (labyrinthe.width - 1)
        // Et qu'il y a pas de mur
        && (cellule.value & 0x1) == 0
        // Et que ce n'est pas la cellule d'où on vient
        && fromCellule.x != (cellule.x + 1)) {
          labyrinthe.cellules[cellule.y][cellule.x + 1].nextCelluleToEnd = cellule;
          this._setTreeTo(labyrinthe.cellules[cellule.y][cellule.x + 1], labyrinthe, cellule);
    }
    // S'il y une cellule en haut
    if (cellule.y > 0
        // Et qu'il y a pas de mur
        && (cellule.value & 0x2) == 0
        // Et que ce n'est pas la cellule d'où on vient
        && fromCellule.y != (cellule.y - 1)) {
          labyrinthe.cellules[cellule.y - 1][cellule.x].nextCelluleToEnd = cellule;
          this._setTreeTo(labyrinthe.cellules[cellule.y - 1][cellule.x], labyrinthe, cellule);
    }
    // S'il y une cellule en bas
    if (cellule.y < (labyrinthe.height - 1)
        // Et qu'il y a pas de mur
        && (cellule.value & 0x8) == 0
        // Et que ce n'est pas la cellule d'où on vient
        && fromCellule.y != (cellule.y + 1)) {
          labyrinthe.cellules[cellule.y + 1][cellule.x].nextCelluleToEnd = cellule;
          this._setTreeTo(labyrinthe.cellules[cellule.y + 1][cellule.x], labyrinthe, cellule);
    }
  }

  this._canMoveToCelluleInDirection = function(cellule, labyrinthe, direction) {
    switch(direction) {
      case 0x1: // droite
        // S'il n'y a pas de mur
        if ((cellule.value & 0x1) == 0
          // Et que la cellule suivante n'a pas été traitée
          && labyrinthe.cellules[cellule.y][cellule.x + 1].nextCelluleToEnd == null) {
            return true;
          } else {
            return false;
          }
        break;
      case 0x2: // haut
        // S'il n'y a pas de mur
        if ((cellule.value & 0x2) == 0
          // Et que la cellule suivante n'a pas été traitée
          && labyrinthe.cellules[cellule.y - 1][cellule.x].nextCelluleToEnd == null) {
            return true;
          } else {
            return false;
          }
        break;
      case 0x4: // gauche
        // S'il n'y a pas de mur
        if ((cellule.value & 0x4) == 0
          // Et que la cellule suivante n'a pas été traitée
          && labyrinthe.cellules[cellule.y][cellule.x - 1].nextCelluleToEnd == null) {
            return true;
          } else {
            return false;
          }
        break;
      case 0x8: // bas
        // S'il n'y a pas de mur
        if ((cellule.value & 0x8) == 0
          // Et que la cellule suivante n'a pas été traitée
          && labyrinthe.cellules[cellule.y + 1][cellule.x].nextCelluleToEnd == null) {
            return true;
          } else {
            return false;
          }
        break;
      default:
        console.log("[ERROR] Direction unknown: " + direction);
        break;
    }
  }

  this._canMoveToCelluleToRight = function(cellule, labyrinthe, direction) {
    var directionToRight = this._turnRight(direction);
    return this._canMoveToCelluleInDirection(cellule, labyrinthe, directionToRight);
  }
  this._canMoveToCelluleToLeft = function(cellule, labyrinthe, direction) {
    var directionToLeft = this._turnLeft(direction);
    return this._canMoveToCelluleInDirection(cellule, labyrinthe, directionToLeft);
  }
  this._canMoveToCelluleToBack = function(cellule, labyrinthe, direction) {
    var directionToBack = this._turnRight(direction);
    directionToBack = this._turnRight(directionToBack);
    return this._canMoveToCelluleInDirection(cellule, labyrinthe, directionToBack);
  }

  this._turnRight = function(direction) {
    direction = direction >> 1 & 0xF;
    if (direction == 0) direction = 0x8; 
    return direction;
  }
  this._turnLeft = function(direction) {
    direction = direction << 1 & 0xF;
    if (direction == 0) direction = 0x1; 
    return direction;
  }

  this._getCelluleInDirection = function(cellule, labyrinthe, direction) {
    switch(direction) {
      case 0x1: // droite
        return labyrinthe.cellules[cellule.y][cellule.x + 1];
        break;
      case 0x2: // haut
        return labyrinthe.cellules[cellule.y - 1][cellule.x];
        break;
      case 0x4: // gauche
        return labyrinthe.cellules[cellule.y][cellule.x - 1];
        break;
      case 0x8: // bas
        return labyrinthe.cellules[cellule.y + 1][cellule.x];
        break;
      default:
        console.log("[ERROR] Direction unknown: " + direction);
        break;
    }
  }

  this._setTreeToNoRecursive = function(cellule, labyrinthe) {
    var remainingCellules = [];
    var direction = 0x4; // on démarre vers la gauche (vu que par défaut la sortie est en bas à droite et que l'algo va chercher à tourner à droite direct)
    // Pour éviter que la cellule cible fasse bugger
    var targetCellule = cellule;
    cellule.nextCelluleToEnd = cellule;
    cellule.direction = 0;
    while (cellule != null) {
      var nextCellule = null;
      // Si la cellule courante n'a pas encore été parcourue
      // console.log("Direction: " + direction);
      // console.log("Cellule before iteration: { x: " + cellule.x + ", y:" + cellule.y + ", value: " + cellule.value + ", direction: " + cellule.direction + ", canGoRight:" + cellule.canGoRight + ", canGoFront: " + cellule.canGoFront, ", canGoLeft: " + cellule.canGoLeft + ", canGoBack: " + cellule.canGoBack + " }");
      if (cellule.direction == 0) {
        cellule.direction = direction;
        cellule.canGoRight = this._canMoveToCelluleToRight(cellule, labyrinthe, cellule.direction);
        cellule.canGoFront = this._canMoveToCelluleInDirection(cellule, labyrinthe, cellule.direction);
        cellule.canGoLeft = this._canMoveToCelluleToLeft(cellule, labyrinthe, cellule.direction);
        cellule.canGoBack = (cellule.nextCelluleToEnd == cellule) && this._canMoveToCelluleToBack(cellule, labyrinthe, cellule.direction); // Uniquement pour la 1ere cellule
        // console.log("Cellule after initialization: { x: " + cellule.x + ", y:" + cellule.y + ", value: " + cellule.value + ", direction: " + cellule.direction + ", canGoRight:" + cellule.canGoRight + ", canGoFront: " + cellule.canGoFront, ", canGoLeft: " + cellule.canGoLeft + ", canGoBack: " + cellule.canGoBack + " }");
      }

      // Si on peut aller vers la cellule à droite (relativement à la direction)
      if (cellule.canGoRight) {
        // console.log("Go to right");
        direction = this._turnRight(direction);
        nextCellule = this._getCelluleInDirection(cellule, labyrinthe, direction);
        nextCellule.nextCelluleToEnd = cellule;
        nextCellule.direction = 0;
        cellule.canGoRight = false;
        if (cellule.canGoFront || cellule.canGoLeft || cellule.canGoBack) {
          // console.log("Push cellule to process remaining path later");
          remainingCellules.push(cellule);
        }
      } else if (cellule.canGoFront) {
        // console.log("Go to front");
        nextCellule = this._getCelluleInDirection(cellule, labyrinthe, direction);
        nextCellule.nextCelluleToEnd = cellule;
        nextCellule.direction = 0;
        cellule.canGoFront = false;
        if (cellule.canGoLeft || cellule.canGoBack) {
          // console.log("Push cellule to process remaining path later");
          remainingCellules.push(cellule);
        }
      } else if (cellule.canGoLeft) {
        // console.log("Go to left");
        direction = this._turnLeft(direction);
        nextCellule = this._getCelluleInDirection(cellule, labyrinthe, direction);
        nextCellule.nextCelluleToEnd = cellule;
        nextCellule.direction = 0;
        cellule.canGoLeft = false;
        if (cellule.canGoBack) {
          // console.log("Push cellule to process remaining path later");
          remainingCellules.push(cellule);
        }
      } else if (cellule.canGoBack) {
        // console.log("Go to back");
        direction = this._turnLeft(direction);
        direction = this._turnLeft(direction);
        nextCellule = this._getCelluleInDirection(cellule, labyrinthe, direction);
        nextCellule.nextCelluleToEnd = cellule;
        nextCellule.direction = 0;
        cellule.canGoBack = false;
      } else {
        // console.log("Dead end, poping cellule in remaining list");
        nextCellule = remainingCellules.pop();
        if (nextCellule != null) {
          direction = nextCellule.direction;
        }
      }
      // console.log("Cellule after iteration: { x: " + cellule.x + ", y:" + cellule.y + ", value: " + cellule.value + ", direction: " + cellule.direction + ", canGoRight:" + cellule.canGoRight + ", canGoFront: " + cellule.canGoFront, ", canGoLeft: " + cellule.canGoLeft + ", canGoBack: " + cellule.canGoBack + " }");
      cellule = nextCellule;
    }
    targetCellule.nextCelluleToEnd = null;
    console.log("initEnd finished");
  }
  this.initEnd = function(celluleEnd, labyrinthe) {
    console.log('Resolution initialization start');
    // this._setTreeTo(celluleEnd, labyrinthe, celluleEnd);
    this._setTreeToNoRecursive(celluleEnd, labyrinthe);
    labyrinthe.resolutionStep = 0;
    console.log('Resolution initialization stop');
  }
  this.fromCellule = function(cellule, finish, labyrinthe) {
    if (cellule != null) {
      cellule.visited = true;
      cellule = cellule.nextCelluleToEnd;
      labyrinthe.resolutionStep++;
    } else {
      finish();
    }
    return cellule;
  }
});
