var Maze = function(windowsWidth, windowsHeight) {
  this.initializing = false;
  this.initialized = false;
  this.generating = false;
  this.generated = false;
  this.resolving = false;
  this.resolved = false;
  this.cellules = [];
  this.width = 50;
  this.height = 50;
  this.cssWidth = 0;
  this.cssHeight = 0;

  this.init = function() {
    var startTime = Date.now();
    this.initializing = true;
    var wWidth = windowsWidth - 30;
    var nbCellule = parseInt(this.width, 10);
    this.cssSize = Math.round(wWidth / nbCellule - 0.5);
    if (this.cssSize < 4) this.cssSize = 4;

    this.cssBorderWidth = Math.round(this.cssSize / 8);
    if (this.cssBorderWidth < 1) this.cssBorderWidth = 1;
    this.cssWidth = this.cssSize - (this.cssBorderWidth * 2)
    this.cssHeight = this.cssSize - (this.cssBorderWidth * 2)
    console.log("width: " + this.width + ", height: " + this.height + ", cssSize: " + this.cssSize + ", cssBorderWidth: " + this.cssBorderWidth + ", cssWidth: " + this.cssWidth + ", cssHeight: " + this.cssHeight);
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
    console.log("Maze initialization duration: " + this.generationInitialization + "ms");
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

app.controller('myCtrl', function($scope, $timeout, $document, mazeGenerator, resolve) {
	console.log('Setting maze...');
  var windowsWidth = window.innerWidth;
  var windowsHeight = window.innerHeight;
  console.log("windowsWidth: " + windowsWidth + ", windowsHeight:" + windowsHeight);
  $scope.maze = new Maze(windowsWidth, windowsHeight);

  var EventListener = function(mazeGenerator, maze, resolve) {
    var started = false;
    this.init = function(maze) {
      console.log("Initialization...")
    }
    this.generate = function(maze) {
      if (! started) {
        started = true;
        maze.generating = true;
        maze.init();
        mazeGenerator.init(maze);
        $scope.maze = maze;
        this.generateMaze(maze);
      } else {
        console.log('generation already started');
      }
    }
    this.generateQuick = function(maze) {
      if (! started) {
        started = true;
        maze.generating = true;
        maze.init();
        mazeGenerator.init(maze);
        startTime = Date.now();
        this.generateQuickMaze(maze);
        endTime = Date.now();
        maze.generationDuration = endTime - startTime;
        $scope.maze = maze;
        console.log("Comprehensive Exploration generation duration: " + maze.generationDuration + "ms");
      } else {
        console.log('generation already started');
      }
    }

    this.generateMaze = function(maze) {
      function finish() {
        clearInterval(intervalId);
        maze.generating = false;
        maze.generated = true;
      }
      // On lance la génération en boucle en async pour qu'angularjs affiche bien le labyrinthe
      // au fur & à mesure de sa génération
      // Quand c'est fini la callback "finish" arrête la boucle
      var intervalId = setInterval(function() {
        $scope.$evalAsync(mazeGenerator.generate(maze, finish));
      }, 0);
    }

    this.generateQuickMaze = function(maze) {
      var finished = false;
      function finish() {
        finished = true;
        maze.generating = false;
        maze.generated = true;
        console.log('generateQuickMaze finished');
      }
      while (! finished) {
        mazeGenerator.generate(maze, finish);
      }
    }

    this.resolveMaze = function(celluleStart, celluleEnd, maze) {
      maze.resetResolution();
      if (celluleStart == null) {
        celluleStart = maze.cellules[0][0];
        celluleStart.selectedStart = true;
        maze.celluleStart = celluleStart;
      }
      if (celluleEnd == null) {
        celluleEnd = maze.cellules[maze.height - 1][maze.width - 1];
        celluleEnd.selectedEnd = true;
        maze.celluleEnd = celluleEnd;
      }
      var cellule = celluleStart;
      function finish() {
        clearInterval(intervalId);
        maze.resolving = false;
        maze.resolved = true;
        console.log('Resolution finished')
      }
      maze.resolving = true;
      console.log('Resolution start')
      resolve.initEnd(celluleEnd, maze);
      var intervalId = setInterval(function() {
        $scope.$evalAsync(cellule = resolve.fromCellule(cellule, finish, maze));
      }, 0);
    }
    this.resolveQuickMaze = function(celluleStart, celluleEnd, maze) {
      if (celluleStart == null) {
        maze.resetResolution();
        celluleStart = maze.cellules[0][0];
        celluleStart.selectedStart = true;
        maze.celluleStart = celluleStart;
      }
      if (celluleEnd == null) {
        celluleEnd = maze.cellules[maze.height - 1][maze.width - 1];
        celluleEnd.selectedEnd = true;
        maze.celluleEnd = celluleEnd;
      }
      var cellule = celluleStart;
      var finished = false;
      function finish() {
        finished = true;
        maze.resolving = false;
        maze.resolved = true;
        console.log('Resolution finished')
      }
      maze.resolving = true;
      console.log('Resolution start')
      var startTime = Date.now();
      var startTimeInitialization = startTime;
      resolve.initEnd(celluleEnd, maze);
      var endTimeInitialization = Date.now();
      console.log("Maze resolution initialization duration: " + (endTimeInitialization - startTimeInitialization) + "ms");

      var startTimeCrawl = endTimeInitialization;
      while (! finished) {
        cellule = resolve.fromCellule(cellule, finish, maze);
      }
      var endTime = Date.now();
      var endTimeCrawl = endTime;
      maze.resolutionDuration = endTime - startTime;
      console.log("Maze resolution crawling duration: " + (endTimeCrawl - startTimeCrawl) + "ms");
      console.log("Maze resolution duration: " + maze.resolutionDuration + "ms");
    }
    this.setStartOrEnd = function(cellule, maze) {
      if (maze.celluleEnd != null) {
        maze.resetResolution();
      } else if (maze.celluleStart == null) {
        maze.celluleStart = cellule;
        cellule.selectedStart = true;
      } else {
        if (cellule != cellule.selectedStart) {
          maze.celluleEnd = cellule;
          cellule.selectedEnd = true;
          this.resolveQuickMaze(maze.celluleStart, maze.celluleEnd, maze);
        }
      }
    }
  }
  var eventListener = new EventListener(mazeGenerator, $scope.maze, resolve);
  $scope.listener = eventListener;
});

app.service('resolve', function() {
  // Deprecated
  // Ancienne fonction récursive pour initialiser le chemin en fonction de la sortie
  // Mais ça plante sur des labyrinthes assez gros (ex: 200x200)
  // Remplacé par _setTreeToNoRecursive
  this._setTreeTo = function(cellule, maze, fromCellule) {
    // S'il y une cellule à gauche
    if (cellule.x > 0
        // Et qu'il y a pas de mur
        && (cellule.value & 0x4) == 0
        // Et que ce n'est pas la cellule d'où on vient
        && fromCellule.x != (cellule.x - 1)) {
          maze.cellules[cellule.y][cellule.x - 1].nextCelluleToEnd = cellule;
          this._setTreeTo(maze.cellules[cellule.y][cellule.x - 1], maze, cellule);
    }
    // S'il y une cellule à droite
    if (cellule.x < (maze.width - 1)
        // Et qu'il y a pas de mur
        && (cellule.value & 0x1) == 0
        // Et que ce n'est pas la cellule d'où on vient
        && fromCellule.x != (cellule.x + 1)) {
          maze.cellules[cellule.y][cellule.x + 1].nextCelluleToEnd = cellule;
          this._setTreeTo(maze.cellules[cellule.y][cellule.x + 1], maze, cellule);
    }
    // S'il y une cellule en haut
    if (cellule.y > 0
        // Et qu'il y a pas de mur
        && (cellule.value & 0x2) == 0
        // Et que ce n'est pas la cellule d'où on vient
        && fromCellule.y != (cellule.y - 1)) {
          maze.cellules[cellule.y - 1][cellule.x].nextCelluleToEnd = cellule;
          this._setTreeTo(maze.cellules[cellule.y - 1][cellule.x], maze, cellule);
    }
    // S'il y une cellule en bas
    if (cellule.y < (maze.height - 1)
        // Et qu'il y a pas de mur
        && (cellule.value & 0x8) == 0
        // Et que ce n'est pas la cellule d'où on vient
        && fromCellule.y != (cellule.y + 1)) {
          maze.cellules[cellule.y + 1][cellule.x].nextCelluleToEnd = cellule;
          this._setTreeTo(maze.cellules[cellule.y + 1][cellule.x], maze, cellule);
    }
  }

  this._canMoveToCelluleInDirection = function(cellule, maze, direction) {
    switch(direction) {
      case 0x1: // droite
        // S'il n'y a pas de mur
        if ((cellule.value & 0x1) == 0
          // Et que la cellule suivante n'a pas été traitée
          && maze.cellules[cellule.y][cellule.x + 1].nextCelluleToEnd == null) {
            return true;
          } else {
            return false;
          }
        break;
      case 0x2: // haut
        // S'il n'y a pas de mur
        if ((cellule.value & 0x2) == 0
          // Et que la cellule suivante n'a pas été traitée
          && maze.cellules[cellule.y - 1][cellule.x].nextCelluleToEnd == null) {
            return true;
          } else {
            return false;
          }
        break;
      case 0x4: // gauche
        // S'il n'y a pas de mur
        if ((cellule.value & 0x4) == 0
          // Et que la cellule suivante n'a pas été traitée
          && maze.cellules[cellule.y][cellule.x - 1].nextCelluleToEnd == null) {
            return true;
          } else {
            return false;
          }
        break;
      case 0x8: // bas
        // S'il n'y a pas de mur
        if ((cellule.value & 0x8) == 0
          // Et que la cellule suivante n'a pas été traitée
          && maze.cellules[cellule.y + 1][cellule.x].nextCelluleToEnd == null) {
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

  this._canMoveToCelluleToRight = function(cellule, maze, direction) {
    var directionToRight = this._turnRight(direction);
    return this._canMoveToCelluleInDirection(cellule, maze, directionToRight);
  }
  this._canMoveToCelluleToLeft = function(cellule, maze, direction) {
    var directionToLeft = this._turnLeft(direction);
    return this._canMoveToCelluleInDirection(cellule, maze, directionToLeft);
  }
  this._canMoveToCelluleToBack = function(cellule, maze, direction) {
    var directionToBack = this._turnRight(direction);
    directionToBack = this._turnRight(directionToBack);
    return this._canMoveToCelluleInDirection(cellule, maze, directionToBack);
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

  this._getCelluleInDirection = function(cellule, maze, direction) {
    switch(direction) {
      case 0x1: // droite
        return maze.cellules[cellule.y][cellule.x + 1];
        break;
      case 0x2: // haut
        return maze.cellules[cellule.y - 1][cellule.x];
        break;
      case 0x4: // gauche
        return maze.cellules[cellule.y][cellule.x - 1];
        break;
      case 0x8: // bas
        return maze.cellules[cellule.y + 1][cellule.x];
        break;
      default:
        console.log("[ERROR] Direction unknown: " + direction);
        break;
    }
  }

  this._setTreeToNoRecursive = function(cellule, maze) {
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
        cellule.canGoRight = this._canMoveToCelluleToRight(cellule, maze, cellule.direction);
        cellule.canGoFront = this._canMoveToCelluleInDirection(cellule, maze, cellule.direction);
        cellule.canGoLeft = this._canMoveToCelluleToLeft(cellule, maze, cellule.direction);
        cellule.canGoBack = (cellule.nextCelluleToEnd == cellule) && this._canMoveToCelluleToBack(cellule, maze, cellule.direction); // Uniquement pour la 1ere cellule
        // console.log("Cellule after initialization: { x: " + cellule.x + ", y:" + cellule.y + ", value: " + cellule.value + ", direction: " + cellule.direction + ", canGoRight:" + cellule.canGoRight + ", canGoFront: " + cellule.canGoFront, ", canGoLeft: " + cellule.canGoLeft + ", canGoBack: " + cellule.canGoBack + " }");
      }

      // Si on peut aller vers la cellule à droite (relativement à la direction)
      if (cellule.canGoRight) {
        // console.log("Go to right");
        direction = this._turnRight(direction);
        nextCellule = this._getCelluleInDirection(cellule, maze, direction);
        nextCellule.nextCelluleToEnd = cellule;
        nextCellule.direction = 0;
        cellule.canGoRight = false;
        if (cellule.canGoFront || cellule.canGoLeft || cellule.canGoBack) {
          // console.log("Push cellule to process remaining path later");
          remainingCellules.push(cellule);
        }
      } else if (cellule.canGoFront) {
        // console.log("Go to front");
        nextCellule = this._getCelluleInDirection(cellule, maze, direction);
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
        nextCellule = this._getCelluleInDirection(cellule, maze, direction);
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
        nextCellule = this._getCelluleInDirection(cellule, maze, direction);
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
  this.initEnd = function(celluleEnd, maze) {
    console.log('Resolution initialization start');
    // this._setTreeTo(celluleEnd, maze, celluleEnd);
    this._setTreeToNoRecursive(celluleEnd, maze);
    maze.resolutionStep = 0;
    console.log('Resolution initialization stop');
  }
  this.fromCellule = function(cellule, finish, maze) {
    if (cellule != null) {
      cellule.visited = true;
      cellule = cellule.nextCelluleToEnd;
      maze.resolutionStep++;
    } else {
      finish();
    }
    return cellule;
  }
});
