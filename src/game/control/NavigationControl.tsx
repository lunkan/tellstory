import { useRef, useState } from "react";
import { useSceneStore } from "../../store/sceneStore";
import { DIRECTION, DIRECTION_NAME } from "../../../shared/src/direction";
import { useThrottle } from "../../effects/throttle";

export function NavigationControl() {
    const directions = useSceneStore((state) => state.directions);
    const attentionDirection = useSceneStore((state) => state.attentionDirection);
    const setAttentionDirection = useSceneStore((state) => state.setAttentionDirection);
    const setFocusMode = useSceneStore((state) => state.setFocusMode);
    const movePlayer = useSceneStore((state) => state.movePlayer);
    const zoomPlayer = useSceneStore((state) => state.zoomPlayer);
    const sendAlertMessage = useSceneStore((state) => state.sendAlertMessage);
    const [screenDownPoint, setScreenDownPoint] = useState<DOMPoint | null>(null);
    const timerRef = useRef<number | null>(null);

    function handleScreenPointerDown(e: React.PointerEvent<HTMLDivElement>): void {
        setFocusMode(true);
        setScreenDownPoint(new DOMPoint(e.clientX, e.clientY));
    }

    function handleScreenPointerUp(): void {
        setScreenDownPoint(null);
        setFocusMode(false);

        if (!attentionDirection) {
            return;
        }

        if (attentionDirection.impassible) {
            const directionName = DIRECTION_NAME[attentionDirection.direction];
            sendAlertMessage(`Not possible to move ${directionName}`);
        } else {
            movePlayer(attentionDirection.direction);
        }
    }

    function handleEnter(direction: DIRECTION): void {
        timerRef.current = setTimeout(() => {
            setAttentionDirection(direction);
        }, 200);
    }

    function handleLeave(): void {
        setAttentionDirection(undefined);
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }

    function handleThrottledZoom(deltaY: number) {
        if (deltaY > 0) {
            console.log('No support for zoom in - use quadrant');
            //zoomPlayer(1);
        } else if (deltaY < 0) {
            const hasDirectionUp = directions.some((direction) => direction.direction === DIRECTION.UP);
            if (hasDirectionUp) {
                zoomPlayer(-1);
            } else {
                sendAlertMessage(`Not possible to zoom to greater level. Yoy reached max`);
            }
        }
    };


    const throttledWheelHandler = useThrottle(handleThrottledZoom, 1000);
    function handleZoom(e: React.WheelEvent<HTMLDivElement>): void {
        throttledWheelHandler(e.deltaY);
    }

    const wrapperClasses = ['navigation-ctrl-wrapper'];
    wrapperClasses.push('navigation-ctrl-wrapper--interruptible');

    if (screenDownPoint) {
        wrapperClasses.push('navigation-ctrl-wrapper--active .nav-sector--center');
    }

    function renderAjacentSegment(direction: DIRECTION, color: string, rotation: string) {
        const playerDirection = directions.find((playerDirection) => playerDirection.direction === direction);

        return (
            <>
                <use
                    href="#segment"
                    className={`nav-sector ${playerDirection?.impassible ? 'nav-sector-impassable' : ''}`}
                    fill={color}
                    transform={`rotate(${rotation}, 100, 100)`}
                    onPointerEnter={() => handleEnter(direction)}
                    onPointerLeave={() => handleLeave()}
                />
            </>
        );
    }

    function renderQuadrantSegment(direction: DIRECTION, color: string, rotation: string) {
        const playerDirection = directions.find((playerDirection) => playerDirection.direction === direction);

        if (!playerDirection) {
            return;
        }

        return (
            <>
                <use
                    href="#inner-seg"
                    className={`nav-sector ${playerDirection?.impassible ? 'nav-sector-impassable' : ''}`}
                    fill={color}
                    transform={`rotate(${rotation}, 100, 100)`}
                    onPointerEnter={() => handleEnter(direction)}
                    onPointerLeave={() => handleLeave()}
                />
            </>
        );
    }

    return (
        <div
            className={wrapperClasses.join(' ')}
            onPointerDown={(e) => handleScreenPointerDown(e)}
            onPointerUp={() => handleScreenPointerUp()}
            onWheel={(e) => handleZoom(e)}
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
                {renderAjacentSegment(DIRECTION.SOUTH_EAST, '#3C2F2F', '157.5')}
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
