/*
 * Camera Buttons
 */

const CameraButtons = function (blueprint3d) {
    console.log('=====> CameraButtons');

    const orbitControls = blueprint3d.three.controls;
    const three = blueprint3d.three;

    const panSpeed = 30;
    const directions = {
        UP: 1,
        DOWN: 2,
        LEFT: 3,
        RIGHT: 4
    };

    function init() {
        console.log('=====> CameraButtons =====> init');
        // Camera controls
        $('#zoom-in').click(zoomIn);
        $('#zoom-out').click(zoomOut);
        $('#zoom-in').dblclick(preventDefault);
        $('#zoom-out').dblclick(preventDefault);

        $('#reset-view').click(three.centerCamera);

        $('#move-left').click(function () {
            pan(directions.LEFT);
        });
        $('#move-right').click(function () {
            pan(directions.RIGHT);
        });
        $('#move-up').click(function () {
            pan(directions.UP);
        });
        $('#move-down').click(function () {
            pan(directions.DOWN);
        });

        $('#move-left').dblclick(preventDefault);
        $('#move-right').dblclick(preventDefault);
        $('#move-up').dblclick(preventDefault);
        $('#move-down').dblclick(preventDefault);
    }

    function preventDefault(e) {
        console.log('=====> CameraButtons =====> preventDefault');
        e.preventDefault();
        e.stopPropagation();
    }

    function pan(direction) {
        console.log('=====> CameraButtons =====> pan');
        switch (direction) {
            case directions.UP:
                orbitControls.panXY(0, panSpeed);
                break;
            case directions.DOWN:
                orbitControls.panXY(0, -panSpeed);
                break;
            case directions.LEFT:
                orbitControls.panXY(panSpeed, 0);
                break;
            case directions.RIGHT:
                orbitControls.panXY(-panSpeed, 0);
                break;
        }
    }

    function zoomIn(e) {
        e.preventDefault();
        orbitControls.dollyIn(1.1);
        orbitControls.update();
    }

    function zoomOut(e) {
        e.preventDefault;
        orbitControls.dollyOut(1.1);
        orbitControls.update();
    }

    init();
};

/*
 * Context menu for selected item
 */

const ContextMenu = function (blueprint3d) {
    console.log('=====> ContextMenu');
    console.log('=====> blueprint3d: ', blueprint3d);
    const scope = this;
    let selectedItem;
    const three = blueprint3d.three;

    function init() {
        console.log('=====> ContextMenu =====> init');
        $('#context-menu-delete').click(function (event) {
            selectedItem.remove();
        });

        three.itemSelectedCallbacks.add(itemSelected);
        three.itemUnselectedCallbacks.add(itemUnselected);

        initResize();

        $('#fixed').click(function () {
            const checked = $(this).prop('checked');
            selectedItem.setFixed(checked);
        });
    }

    function cmToIn(cm) {
        return cm / 2.54;
    }

    function inToCm(inches) {
        return inches * 2.54;
    }

    function itemSelected(item) {
        console.log('=====> ContextMenu =====> itemSelected');
        selectedItem = item;

        console.log('=====> selectedItem: ', selectedItem);

        $('#context-menu-name').text(item.metadata.itemName);

        $('#item-width').val(cmToIn(selectedItem.getWidth()).toFixed(0));
        $('#item-height').val(cmToIn(selectedItem.getHeight()).toFixed(0));
        $('#item-depth').val(cmToIn(selectedItem.getDepth()).toFixed(0));

        $('#context-menu').show();

        $('#fixed').prop('checked', item.fixed);
    }

    function resize() {
        console.log('=====> ContextMenu =====> resize');
        selectedItem.resize(
            inToCm($('#item-height').val()),
            inToCm($('#item-width').val()),
            inToCm($('#item-depth').val())
        );
    }

    function initResize() {
        console.log('=====> ContextMenu =====> initResize');
        $('#item-height').change(resize);
        $('#item-width').change(resize);
        $('#item-depth').change(resize);
    }

    function itemUnselected() {
        console.log('=====> ContextMenu =====> itemUnselected');
        selectedItem = null;
        $('#context-menu').hide();
    }

    init();
};

/*
 * Loading modal for items
 */

const ModalEffects = function (blueprint3dAttr) {
    console.log('=====> ModalEffects');

    const scope = this;
    const blueprint3d = blueprint3dAttr;
    let itemsLoading = 0;

    this.setActiveItem = function (active) {
        itemSelected = active;
        update();
    };

    function update() {
        console.log('=====> ModalEffects =====> update');
        if (itemsLoading > 0) {
            $('#loading-modal').show();
        } else {
            $('#loading-modal').hide();
        }
    }

    function init() {
        console.log('=====> ModalEffects =====> init');
        blueprint3d.model.scene.itemLoadingCallbacks.add(function () {
            itemsLoading += 1;
            update();
        });

        blueprint3d.model.scene.itemLoadedCallbacks.add(function () {
            itemsLoading -= 1;
            update();
        });

        update();
    }

    init();
};

/*
 * Side menu
 */

const SideMenu = function (blueprint3dAttr, floorplanControlsAttr, modalEffectsAttr) {
    console.log('=====> SideMenu');
    const blueprint3d = blueprint3dAttr;
    const floorplanControls = floorplanControlsAttr;
    const modalEffects = modalEffectsAttr;

    const ACTIVE_CLASS = 'active';

    const tabs = {
        'FLOORPLAN': $('#floorplan_tab'),
        'SHOP': $('#items_tab'),
        'DESIGN': $('#design_tab')
    };

    const scope = this;
    this.stateChangeCallbacks = $.Callbacks();

    this.states = {
        'DEFAULT': {
            'div': $('#viewer'),
            'tab': tabs.DESIGN
        },
        'FLOORPLAN': {
            'div': $('#floorplanner'),
            'tab': tabs.FLOORPLAN
        },
        'SHOP': {
            'div': $('#add-items'),
            'tab': tabs.SHOP
        }
    };

    // sidebar state
    let currentState = scope.states.FLOORPLAN;

    function init() {
        console.log('=====> SideMenu =====> init');
        for (const tab in tabs) {
            const elem = tabs[tab];
            elem.click(tabClicked(elem));
        }

        $('#update-floorplan').click(floorplanUpdate);

        initLeftMenu();

        blueprint3d.three.updateWindowSize();
        handleWindowResize();

        initItems();

        setCurrentState(scope.states.DEFAULT);
    }

    function floorplanUpdate() {
        console.log('=====> SideMenu =====> floorplanUpdate');
        setCurrentState(scope.states.DEFAULT);
    }

    function tabClicked(tab) {
        console.log('=====> SideMenu =====> tabClicked');
        return function () {
            // Stop three from spinning
            blueprint3d.three.stopSpin();

            // Selected a new tab
            for (const key in scope.states) {
                const state = scope.states[key];
                if (state.tab == tab) {
                    setCurrentState(state);
                    break;
                }
            }
        };
    }

    function setCurrentState(newState) {
        console.log('=====> SideMenu =====> setCurrentState');

        if (currentState == newState) {
            return;
        }

        // show the right tab as active
        if (currentState.tab !== newState.tab) {
            if (currentState.tab != null) {
                currentState.tab.removeClass(ACTIVE_CLASS);
            }
            if (newState.tab != null) {
                newState.tab.addClass(ACTIVE_CLASS);
            }
        }

        // set item unselected
        blueprint3d.three.getController().setSelectedObject(null);

        // show and hide the right divs
        currentState.div.hide();
        newState.div.show();

        // custom actions
        if (newState == scope.states.FLOORPLAN) {
            floorplanControls.updateFloorplanView();
            floorplanControls.handleWindowResize();
        }

        if (currentState == scope.states.FLOORPLAN) {
            blueprint3d.model.floorplan.update();
        }

        if (newState == scope.states.DEFAULT) {
            blueprint3d.three.updateWindowSize();
        }

        // set new state
        handleWindowResize();
        currentState = newState;

        scope.stateChangeCallbacks.fire(newState);
    }

    function initLeftMenu() {
        console.log('=====> SideMenu =====> initLeftMenu');
        $(window).resize(handleWindowResize);
        handleWindowResize();
    }

    function handleWindowResize() {
        console.log('=====> SideMenu =====> handleWindowResize');
        $('.sidebar').height(window.innerHeight);
        $('#add-items').height(window.innerHeight);

    }

    // TODO: this doesn't really belong here
    function initItems() {
        console.log('=====> SideMenu =====> initItems');
        $('#add-items').find('.add-item').mousedown(function (e) {
            const modelUrl = $(this).attr('model-url');
            const itemType = parseInt($(this).attr('model-type'));
            const metadata = {
                itemName: $(this).attr('model-name'),
                resizable: true,
                modelUrl: modelUrl,
                itemType: itemType,
                modelCode: $(this).attr('model-code')
            };

            blueprint3d.model.scene.addItem(itemType, modelUrl, metadata);
            setCurrentState(scope.states.DEFAULT);
        });
    }

    init();

};

/*
 * Change floor and wall textures
 */

const TextureSelector = function (blueprint3d, sideMenu) {
    console.log('=====> TextureSelector');

    const scope = this;
    const three = blueprint3d.three;

    let currentTarget = null;

    function initTextureSelectors() {
        console.log('=====> TextureSelector =====> initTextureSelectors');
        $('.texture-select-thumbnail').click(function (e) {
            const textureUrl = $(this).attr('texture-url');
            const textureStretch = ($(this).attr('texture-stretch') == 'true');
            const textureScale = parseInt($(this).attr('texture-scale'));
            currentTarget.setTexture(textureUrl, textureStretch, textureScale);

            e.preventDefault();
        });
    }

    function init() {
        console.log('=====> TextureSelector =====> init');
        three.wallClicked.add(wallClicked);
        three.floorClicked.add(floorClicked);
        three.itemSelectedCallbacks.add(reset);
        three.nothingClicked.add(reset);
        sideMenu.stateChangeCallbacks.add(reset);
        initTextureSelectors();
    }

    function wallClicked(halfEdge) {
        console.log('=====> TextureSelector =====> wallClicked');
        currentTarget = halfEdge;
        $('#floorTexturesDiv').hide();
        $('#wallTextures').show();
    }

    function floorClicked(room) {
        console.log('=====> TextureSelector =====> floorClicked');
        currentTarget = room;
        $('#wallTextures').hide();
        $('#floorTexturesDiv').show();
    }

    function reset() {
        console.log('=====> TextureSelector =====> reset');
        $('#wallTextures').hide();
        $('#floorTexturesDiv').hide();
    }

    init();
};

/*
 * Floorplanner controls
 */

const ViewerFloorplanner = function (blueprint3d) {
    console.log('=====> ViewerFloorplanner');

    const canvasWrapper = '#floorplanner';

    // buttons
    const move = '#move';
    const remove = '#delete';
    const draw = '#draw';

    const activeStlye = 'btn-primary disabled';

    this.floorplanner = blueprint3d.floorplanner;

    const scope = this;

    function init() {
        console.log('ViewerFloorplanner =====> init');

        $(window).resize(scope.handleWindowResize);
        scope.handleWindowResize();

        // mode buttons
        scope.floorplanner.modeResetCallbacks.add(function (mode) {
            $(draw).removeClass(activeStlye);
            $(remove).removeClass(activeStlye);
            $(move).removeClass(activeStlye);
            if (mode == BP3D.Floorplanner.floorplannerModes.MOVE) {
                $(move).addClass(activeStlye);
            } else if (mode == BP3D.Floorplanner.floorplannerModes.DRAW) {
                $(draw).addClass(activeStlye);
            } else if (mode == BP3D.Floorplanner.floorplannerModes.DELETE) {
                $(remove).addClass(activeStlye);
            }

            if (mode == BP3D.Floorplanner.floorplannerModes.DRAW) {
                $('#draw-walls-hint').show();
                scope.handleWindowResize();
            } else {
                $('#draw-walls-hint').hide();
            }
        });

        $(move).click(function () {
            scope.floorplanner.setMode(BP3D.Floorplanner.floorplannerModes.MOVE);
        });

        $(draw).click(function () {
            scope.floorplanner.setMode(BP3D.Floorplanner.floorplannerModes.DRAW);
        });

        $(remove).click(function () {
            scope.floorplanner.setMode(BP3D.Floorplanner.floorplannerModes.DELETE);
        });
    }

    this.updateFloorplanView = function () {
        console.log('ViewerFloorplanner =====> updateFloorplanView');
        scope.floorplanner.reset();
    };

    this.handleWindowResize = function () {
        console.log('ViewerFloorplanner =====> handleWindowResize');
        $(canvasWrapper).height(window.innerHeight - $(canvasWrapper).offset().top);
        scope.floorplanner.resizeView();
    };

    init();
};

const mainControls = function (blueprint3dAttr) {
    console.log('=====> mainControls');
    const blueprint3d = blueprint3dAttr;

    function newDesign() {
        console.log('=====> mainControls =====> newDesign');
        blueprint3d.model.loadSerialized('{"floorplan":{"corners":{"f90da5e3-9e0e-eba7-173d-eb0b071e838e":{"x":204.85099999999989,"y":289.052},"da026c08-d76a-a944-8e7b-096b752da9ed":{"x":672.2109999999999,"y":289.052},"4e3d65cb-54c0-0681-28bf-bddcc7bdb571":{"x":672.2109999999999,"y":-178.308},"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2":{"x":204.85099999999989,"y":-178.308}},"walls":[{"corner1":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","corner2":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","corner2":"da026c08-d76a-a944-8e7b-096b752da9ed","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"da026c08-d76a-a944-8e7b-096b752da9ed","corner2":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","corner2":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}}],"wallTextures":[],"floorTextures":{},"newFloorTextures":{}},"items":[]}');
    }

    function loadDesign() {
        console.log('=====> mainControls =====> loadDesign');

        files = $('#loadFile').get(0).files;
        const reader = new FileReader();
        reader.onload = function (event) {
            const data = event.target.result;
            blueprint3d.model.loadSerialized(data);
            console.log('=====> blueprint3d: ', blueprint3d.model.scene.items);
        };
        reader.readAsText(files[0]);
    }

    function saveDesign() {
        console.log('=====> mainControls =====> saveDesign');
        const data = blueprint3d.model.exportSerialized();
        const a = window.document.createElement('a');
        const blob = new Blob([data], {type: 'text'});

        a.href = window.URL.createObjectURL(blob);
        a.download = 'design.blueprint3d';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function init() {
        console.log('=====> mainControls =====> init');
        $('#new').click(newDesign);
        $('#loadFile').change(loadDesign);
        $('#saveFile').click(saveDesign);
    }

    init();
};

const apiControls = function (blueprint3dAttr) {
    console.log('=====> apiControls');
    const blueprint3d = blueprint3dAttr;

    function getItemsList() {
        const modelItems = blueprint3d.model.scene.getItems();
        const items = new Map();
        const jsonArr = [];

        modelItems.forEach(function (item) {
            const modelCode = item.metadata.modelCode;

            if (!items.has(modelCode)) {
                items.set(modelCode, {code: modelCode, quantity: 1});
            } else {
                items.get(modelCode).quantity++;
            }
        });

        for (const [key, value] of items) {
            jsonArr.push(value);
        }

        alert(JSON.stringify(jsonArr));
    }

    function init() {
        $('#get-items').click(getItemsList);
    }

    init();
};

/*
 * Initialize!
 */

$(document).ready(function () {
    console.log('=====> ready');

    // main setup
    const opts = {
        floorplannerElement: 'floorplanner-canvas',
        threeElement: '#viewer',
        threeCanvasElement: 'three-canvas',
        textureDir: 'models/textures/',
        widget: false
    };
    const blueprint3d = new BP3D.Blueprint3d(opts);
    console.log('=====> blueprint3d: ', blueprint3d);
    const modalEffects = new ModalEffects(blueprint3d);
    const viewerFloorplanner = new ViewerFloorplanner(blueprint3d);
    const contextMenu = new ContextMenu(blueprint3d);
    const sideMenu = new SideMenu(blueprint3d, viewerFloorplanner, modalEffects);
    const textureSelector = new TextureSelector(blueprint3d, sideMenu);
    const cameraButtons = new CameraButtons(blueprint3d);

    mainControls(blueprint3d);
    apiControls(blueprint3d);

    // This serialization format needs work
    // Load a simple rectangle room
    blueprint3d.model.loadSerialized('{"floorplan":{"corners":{"f90da5e3-9e0e-eba7-173d-eb0b071e838e":{"x":204.85099999999989,"y":289.052},"da026c08-d76a-a944-8e7b-096b752da9ed":{"x":672.2109999999999,"y":289.052},"4e3d65cb-54c0-0681-28bf-bddcc7bdb571":{"x":672.2109999999999,"y":-178.308},"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2":{"x":204.85099999999989,"y":-178.308}},"walls":[{"corner1":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","corner2":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","corner2":"da026c08-d76a-a944-8e7b-096b752da9ed","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"da026c08-d76a-a944-8e7b-096b752da9ed","corner2":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","corner2":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}}],"wallTextures":[],"floorTextures":{},"newFloorTextures":{}},"items":[]}');
});
