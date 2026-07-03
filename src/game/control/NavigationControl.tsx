import { useRef, useState } from "react";
import { useSceneStore } from "../../store/sceneStore";
import { DIRECTION, DIRECTION_NAME } from "../../../shared/src/direction";
import { World } from "../../../engine/world/world";

export function NavigationControl() {
    const currentPosition = useSceneStore((state) => state.currentPosition);
    const directions = useSceneStore((state) => state.directions);
    const attention = useSceneStore((state) => state.attention);
    const setAttention = useSceneStore((state) => state.setAttention);
    const movePlayer = useSceneStore((state) => state.movePlayer);
    const zoomPlayer = useSceneStore((state) => state.zoomPlayer);
    const sendAlertMessage = useSceneStore((state) => state.sendAlertMessage);
    const [screenDownPoint, setScreenDownPoint] = useState<DOMPoint | null>(null);
    const zoom = useRef<number>(0);
    const zoomTimerRef = useRef<number | undefined>(undefined);
    const proximityTimerRef = useRef<number | undefined>(undefined);
    const active = useRef<boolean>(false);

    function handleScreenPointerDown(e: React.PointerEvent<HTMLDivElement>): void {
        e.currentTarget.setPointerCapture(e.pointerId);
        active.current = true;
        setAttention({ type: 'direction', value: undefined });
        setScreenDownPoint(new DOMPoint(e.clientX, e.clientY));

        proximityTimerRef.current = setTimeout(() => {
            setAttention({ type: 'direction', value: DIRECTION.NONE });
        }, 2000);
    }

    function handleScreenPointerUp(e: React.PointerEvent<HTMLDivElement>): void {
        e.currentTarget.releasePointerCapture(e.pointerId);
        active.current = false;
        clearTimeout(proximityTimerRef.current);
        setScreenDownPoint(null);
        setAttention(null);

        if (!attention || attention.type !== 'direction') {
            return;
        }

        const directionConfig = directions.find((direction) => attention.value === direction.direction)
        if (directionConfig && directionConfig.impassible) {
            const directionName = DIRECTION_NAME[directionConfig.direction];
            sendAlertMessage({
                id: '',
                label: 'Alert',
                text: `Not possible to move ${directionName}`
            });

            //`Not possible to move ${directionName}`);
            return;
        } else if (attention.value && attention.value !== DIRECTION.NONE) {
            movePlayer(attention.value);
        }
    }

    function handleScreenPointerMove(e: React.PointerEvent<HTMLDivElement>): void {
        if (!screenDownPoint) {
            return; // Not dragging
        }

        if (Math.max(Math.abs(screenDownPoint.x - e.clientX), Math.abs(screenDownPoint.x - e.clientX)) > 40) {
            clearTimeout(proximityTimerRef.current);
        }

        const element = document.elementFromPoint(e.clientX, e.clientY);
        const direction = element ? Number((element as any).dataset.direction) || undefined : undefined;

        if (direction !== attention?.value) {
            setAttention({ type: 'direction', value: direction });
        }
    }

    function handleZoom(e: React.WheelEvent<HTMLDivElement>): void {
        if (!currentPosition) {
            return;
        }

        zoom.current = e.deltaY > 0
            ? Math.min(zoom.current + 1, World.MAX_ZOOM_DEPTH - currentPosition.z)
            : Math.max(zoom.current - 1, World.MIN_ZOOM_DEPTH - currentPosition.z);

        const normDepth = Math.max(World.MIN_ZOOM_DEPTH, Math.min(World.MAX_ZOOM_DEPTH, currentPosition.z + zoom.current));
        setAttention({ type: 'zoom', value: normDepth });
        clearTimeout(zoomTimerRef.current);

        zoomTimerRef.current = setTimeout(() => {
            if (normDepth !== currentPosition.z) {
                zoomPlayer(normDepth);
            }
        }, 2000);
    }

    const wrapperClasses = ['navigation-ctrl-wrapper'];
    wrapperClasses.push('navigation-ctrl-wrapper--interruptible');

    if (screenDownPoint) {
        wrapperClasses.push('navigation-ctrl-wrapper--active .nav-sector--center');
    }

    function renderAjacentSegment(direction: DIRECTION, color: string, rotation: string) {
        const playerDirection = directions.find((playerDirection) => playerDirection.direction === direction);
        const classes = ['nav-sector'];

        if (playerDirection?.impassible) {
            classes.push('nav-sector-impassable');
        }

        if (direction === attention?.value) {
            classes.push('navigation-ctrl-segment--active');
        }

        return (
            <>
                <use
                    href="#segment"
                    className={classes.join(' ')}
                    fill={color}
                    transform={`rotate(${rotation}, 100, 100)`}
                    data-direction={direction}
                />
            </>
        );
    }

    function renderQuadrantSegment(direction: DIRECTION, color: string, rotation: string) {
        const playerDirection = directions.find((playerDirection) => playerDirection.direction === direction);
        const classes = ['nav-sector'];

        if (!playerDirection) {
            return;
        }

        if (playerDirection?.impassible) {
            classes.push('nav-sector-impassable');
        }

        if (direction === attention?.value) {
            classes.push('navigation-ctrl-segment--active');
        }

        return (
            <>
                <use
                    href="#inner-seg"
                    className={classes.join(' ')}
                    fill={color}
                    transform={`rotate(${rotation}, 100, 100)`}
                    data-direction={direction}
                />
            </>
        );
    }

    return (
        <div
            className={wrapperClasses.join(' ')}
            onPointerDown={(e) => handleScreenPointerDown(e)}
            onPointerMove={(e) => handleScreenPointerMove(e)}
            onPointerUp={(e) => handleScreenPointerUp(e)}
            onPointerCancel={(e) => console.log("cancel", e.pointerType, e)}
            onLostPointerCapture={() => console.log("lost capture")}
            onWheel={(e) => handleZoom(e)}
            style={{ touchAction: 'none' }}
        >
            <svg
                className="navigation-ctrl-wrapper--nav"
                style={{ left: screenDownPoint?.x, top: screenDownPoint?.y }}
                width="100%"
                height="100%"
                viewBox="0 0 200 200"
                xmlns="http://w3.org"
            >
                <defs>
                    <path id="segment" d="M 200 100 A 100 100 0 0 1 170.71 170.71 L 146.67 146.67 A 66 66 0 0 0 166 100 Z" />
                    <path id="inner-seg" d="M 166 100 A 66 66 0 0 1 100 166 L 100 133 A 33 33 0 0 0 133 100 Z" />
                </defs>

                <circle className="nav-sector nav-sector--center" cx="100" cy="100" r="33" fill="#3C2F2F" />

                {renderAjacentSegment(DIRECTION.SOUTH_WEST, '#6F4436', '22.5')}
                {renderAjacentSegment(DIRECTION.SOUTH, '#3C2F2F', '67.5')}
                {renderAjacentSegment(DIRECTION.SOUTH_EAST, '#6F4436', '112.5')}
                {renderAjacentSegment(DIRECTION.EAST, '#3C2F2F', '157.5')}
                {renderAjacentSegment(DIRECTION.NORTH_EAST, '#6F4436', '202.5')}
                {renderAjacentSegment(DIRECTION.NORTH, '#3C2F2F', '247.5')}
                {renderAjacentSegment(DIRECTION.NORTH_WEST, '#6F4436', '292.5')}
                {renderAjacentSegment(DIRECTION.WEST, '#3C2F2F', '337.5')}

                {renderQuadrantSegment(DIRECTION.CLOSE_SOUTH_WEST, '#DFCCAF', '0')}
                {renderQuadrantSegment(DIRECTION.CLOSE_SOUTH_EAST, '#BE9B7B', '90')}
                {renderQuadrantSegment(DIRECTION.CLOSE_NORTH_EAST, '#DFCCAF', '180')}
                {renderQuadrantSegment(DIRECTION.CLOSE_NORTH_WEST, '#BE9B7B', '270')}
            </svg>

        </div>
    );
}
