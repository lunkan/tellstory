import { useRef } from "react";
import { useSceneStore } from "./store/sceneStore";
import { DIRECTION } from "../constants";
import { DirectionData } from "../storyteller/types";
import { useLocationStore } from "./store/locationStore";

export function NavigationControl() {
    const setActiveDirecton = useSceneStore((state) => state.setActiveDirecton);
    const sceneIntroductionComplete = useSceneStore((state) => state.sceneIntroductionComplete);
    const sceneReadyForInteraction = useSceneStore((state) => state.sceneReadyForInteraction);
    const movePlayer = useLocationStore((state) => state.movePlayer);
    const timerRef = useRef<number | null>(null);

    function handleEnter(direction: DirectionData): void {
        timerRef.current = setTimeout(() => {
            setActiveDirecton(direction);
        }, 1000);
    }

    function handleLeave(): void {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }

    function handleClick(direction: DirectionData): void {
        movePlayer(direction);
    }

    const adjacentSouthWestData = { type: 'adjacentDirection', direction: DIRECTION.SOUTH_WEST } as DirectionData;
    const adjacentSouthData = { type: 'adjacentDirection', direction: DIRECTION.SOUTH } as DirectionData;
    const adjacentSouthEastData = { type: 'adjacentDirection', direction: DIRECTION.SOUTH_EAST } as DirectionData;
    const adjacentEastData = { type: 'adjacentDirection', direction: DIRECTION.EAST } as DirectionData;
    const adjacentNorthEastData = { type: 'adjacentDirection', direction: DIRECTION.NORTH_EAST } as DirectionData;
    const adjacentNorthData = { type: 'adjacentDirection', direction: DIRECTION.NORTH } as DirectionData;
    const adjacentNorthWestData = { type: 'adjacentDirection', direction: DIRECTION.NORTH_WEST } as DirectionData;
    const adjacentWestData = { type: 'adjacentDirection', direction: DIRECTION.WEST } as DirectionData;

    const quadrantSouthWestData = { type: 'quadrantDirection', direction: DIRECTION.SOUTH_WEST } as DirectionData;
    const quadrantSouthEastData = { type: 'quadrantDirection', direction: DIRECTION.SOUTH_EAST } as DirectionData;
    const quadrantNorthEastData = { type: 'quadrantDirection', direction: DIRECTION.NORTH_EAST } as DirectionData;
    const quadrantNorthWestData = { type: 'quadrantDirection', direction: DIRECTION.NORTH_WEST } as DirectionData;

    const wrapperClasses = ['navigation-ctrl-wrapper'];
    if (sceneIntroductionComplete) {
        console.log('interruptible');
        wrapperClasses.push('navigation-ctrl-wrapper--interruptible');
    }

    if (sceneReadyForInteraction) {
        console.log('ready');
        wrapperClasses.push('navigation-ctrl-wrapper--ready');
    }

    return (
        <div className={wrapperClasses.join(' ')}>
            <svg width="50%" height="50%" viewBox="0 0 200 200" xmlns="http://w3.org">
            <defs>
                <path id="segment" d="M 200 100 A 100 100 0 0 1 170.71 170.71 L 146.67 146.67 A 66 66 0 0 0 166 100 Z" />
                <path id="inner-seg" d="M 166 100 A 66 66 0 0 1 100 166 L 100 133 A 33 33 0 0 0 133 100 Z" />
            </defs>

            <circle className="nav-sector nav-sector--center" cx="100" cy="100" r="33" fill="#3C2F2F"/>

            <use
                href="#segment"
                className="nav-sector"
                fill="#6F4436"
                transform="rotate(22.5, 100, 100)"
                onClick={() => handleClick(adjacentSouthWestData)}
                onPointerEnter={() => handleEnter(adjacentSouthWestData)}
                onPointerLeave={() => handleLeave()}
            />
            <use
                href="#segment"
                className="nav-sector"
                fill="#3C2F2F"
                transform="rotate(67.5, 100, 100)"
                onClick={() => handleClick(adjacentSouthData)}
                onPointerEnter={() => handleEnter(adjacentSouthData)}
                onPointerLeave={() => handleLeave()}
            />
            <use
                href="#segment"
                className="nav-sector"
                fill="#6F4436"
                transform="rotate(112.5, 100, 100)"
                onClick={() => handleClick(adjacentSouthEastData)}
                onPointerEnter={() => handleEnter(adjacentSouthEastData)}
                onPointerLeave={() => handleLeave()}
            />
            <use
                href="#segment"
                className="nav-sector"
                fill="#3C2F2F"
                transform="rotate(157.5, 100, 100)"
                onClick={() => handleClick(adjacentEastData)}
                onPointerEnter={() => handleEnter(adjacentEastData)}
                onPointerLeave={() => handleLeave()}
            />
            <use
                href="#segment"
                className="nav-sector"
                fill="#6F4436" transform="rotate(202.5, 100, 100)"
                onClick={() => handleClick(adjacentNorthEastData)}
                onPointerEnter={() => handleEnter(adjacentNorthEastData)}
                onPointerLeave={() => handleLeave()}
            />
            <use
                href="#segment"
                className="nav-sector"
                fill="#3C2F2F"
                transform="rotate(247.5, 100, 100)"
                onClick={() => handleClick(adjacentNorthData)}
                onPointerEnter={() => handleEnter(adjacentNorthData)}
                onPointerLeave={() => handleLeave()}
            />
            <use
                href="#segment"
                className="nav-sector"
                fill="#6F4436"
                transform="rotate(292.5, 100, 100)"
                onClick={() => handleClick(adjacentNorthWestData)}
                onPointerEnter={() => handleEnter(adjacentNorthWestData)}
                onPointerLeave={() => handleLeave()}
            />
            <use
                href="#segment"
                className="nav-sector"
                fill="#3C2F2F"
                transform="rotate(337.5, 100, 100)"
                onClick={() => handleClick(adjacentWestData)}
                onPointerEnter={() => handleEnter(adjacentWestData)}
                onPointerLeave={() => handleLeave()}
            />

            <use
                href="#inner-seg"
                className="nav-sector"
                fill="#DFCCAF"
                transform="rotate(0, 100, 100)"
                onClick={() => handleClick(quadrantSouthWestData)}
                onPointerEnter={() => handleEnter(quadrantSouthWestData)}
                onPointerLeave={() => handleLeave()}
            />
            <use
                href="#inner-seg"
                className="nav-sector"
                fill="#BE9B7B"
                transform="rotate(90, 100, 100)"
                onClick={() => handleClick(quadrantSouthEastData)}
                onPointerEnter={() => handleEnter(quadrantSouthEastData)}
                onPointerLeave={() => handleLeave()}
            />
            <use
                href="#inner-seg"
                className="nav-sector"
                fill="#DFCCAF"
                transform="rotate(180, 100, 100)"
                onClick={() => handleClick(quadrantNorthEastData)}
                onPointerEnter={() => handleEnter(quadrantNorthEastData)}
                onPointerLeave={() => handleLeave()}
            />
            <use
                href="#inner-seg"
                className="nav-sector"
                fill="#BE9B7B"
                transform="rotate(270, 100, 100)"
                onClick={() => handleClick(quadrantNorthWestData)}
                onPointerEnter={() => handleEnter(quadrantNorthWestData)}
                onPointerLeave={() => handleLeave()}
            />
            </svg>
        </div>
    );
}