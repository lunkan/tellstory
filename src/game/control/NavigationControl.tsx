import { useRef } from "react";
import { useSceneStore } from "../../store/sceneStore";
import { DIRECTION } from "../../../shared/src/direction";
import { useGameStore } from "../../store/gameStore";
//import { useLocationStore } from "../../store/locationStore";

export function NavigationControl() {
    const setAttentionDirection = useSceneStore((state) => state.setAttentionDirection);
    const movePlayer = useGameStore((state) => state.movePlayer);


    //const sceneIntroductionComplete = useSceneStore((state) => state.sceneIntroductionComplete);
    //const sceneReadyForInteraction = useSceneStore((state) => state.sceneReadyForInteraction);
    //const movePlayer = useLocationStore((state) => state.movePlayer);

    const timerRef = useRef<number | null>(null);

    function handleEnter(direction: DIRECTION): void {
        timerRef.current = setTimeout(() => {
            setAttentionDirection(direction);
        }, 1000);
    }

    function handleLeave(): void {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }

    function handleClick(direction: DIRECTION): void {
        movePlayer(direction);
    }

    const wrapperClasses = ['navigation-ctrl-wrapper'];
    //if (sceneIntroductionComplete) {
    //    console.log('interruptible');
    wrapperClasses.push('navigation-ctrl-wrapper--interruptible');
    //}

    //if (sceneReadyForInteraction) {
    //    console.log('ready');
    wrapperClasses.push('navigation-ctrl-wrapper--ready');
    //}

    return (
        <div className={wrapperClasses.join(' ')}>
            <svg width="50%" height="50%" viewBox="0 0 200 200" xmlns="http://w3.org">
                <defs>
                    <path id="segment" d="M 200 100 A 100 100 0 0 1 170.71 170.71 L 146.67 146.67 A 66 66 0 0 0 166 100 Z" />
                    <path id="inner-seg" d="M 166 100 A 66 66 0 0 1 100 166 L 100 133 A 33 33 0 0 0 133 100 Z" />
                </defs>

                <circle className="nav-sector nav-sector--center" cx="100" cy="100" r="33" fill="#3C2F2F" />

                <use
                    href="#segment"
                    className="nav-sector"
                    fill="#6F4436"
                    transform="rotate(22.5, 100, 100)"
                    onClick={() => handleClick(DIRECTION.SOUTH_WEST)}
                    onPointerEnter={() => handleEnter(DIRECTION.SOUTH_WEST)}
                    onPointerLeave={() => handleLeave()}
                />
                <use
                    href="#segment"
                    className="nav-sector"
                    fill="#3C2F2F"
                    transform="rotate(67.5, 100, 100)"
                    onClick={() => handleClick(DIRECTION.SOUTH)}
                    onPointerEnter={() => handleEnter(DIRECTION.SOUTH)}
                    onPointerLeave={() => handleLeave()}
                />
                <use
                    href="#segment"
                    className="nav-sector"
                    fill="#6F4436"
                    transform="rotate(112.5, 100, 100)"
                    onClick={() => handleClick(DIRECTION.SOUTH_EAST)}
                    onPointerEnter={() => handleEnter(DIRECTION.SOUTH_EAST)}
                    onPointerLeave={() => handleLeave()}
                />
                <use
                    href="#segment"
                    className="nav-sector"
                    fill="#3C2F2F"
                    transform="rotate(157.5, 100, 100)"
                    onClick={() => handleClick(DIRECTION.EAST)}
                    onPointerEnter={() => handleEnter(DIRECTION.EAST)}
                    onPointerLeave={() => handleLeave()}
                />
                <use
                    href="#segment"
                    className="nav-sector"
                    fill="#6F4436" transform="rotate(202.5, 100, 100)"
                    onClick={() => handleClick(DIRECTION.NORTH_EAST)}
                    onPointerEnter={() => handleEnter(DIRECTION.NORTH_EAST)}
                    onPointerLeave={() => handleLeave()}
                />
                <use
                    href="#segment"
                    className="nav-sector"
                    fill="#3C2F2F"
                    transform="rotate(247.5, 100, 100)"
                    onClick={() => handleClick(DIRECTION.NORTH)}
                    onPointerEnter={() => handleEnter(DIRECTION.NORTH)}
                    onPointerLeave={() => handleLeave()}
                />
                <use
                    href="#segment"
                    className="nav-sector"
                    fill="#6F4436"
                    transform="rotate(292.5, 100, 100)"
                    onClick={() => handleClick(DIRECTION.NORTH_WEST)}
                    onPointerEnter={() => handleEnter(DIRECTION.NORTH_WEST)}
                    onPointerLeave={() => handleLeave()}
                />
                <use
                    href="#segment"
                    className="nav-sector"
                    fill="#3C2F2F"
                    transform="rotate(337.5, 100, 100)"
                    onClick={() => handleClick(DIRECTION.WEST)}
                    onPointerEnter={() => handleEnter(DIRECTION.WEST)}
                    onPointerLeave={() => handleLeave()}
                />

                <use
                    href="#inner-seg"
                    className="nav-sector"
                    fill="#DFCCAF"
                    transform="rotate(0, 100, 100)"
                    onClick={() => handleClick(DIRECTION.CLOSE_SOUTH_WEST)}
                    onPointerEnter={() => handleEnter(DIRECTION.CLOSE_SOUTH_WEST)}
                    onPointerLeave={() => handleLeave()}
                />
                <use
                    href="#inner-seg"
                    className="nav-sector"
                    fill="#BE9B7B"
                    transform="rotate(90, 100, 100)"
                    onClick={() => handleClick(DIRECTION.CLOSE_SOUTH_EAST)}
                    onPointerEnter={() => handleEnter(DIRECTION.CLOSE_SOUTH_EAST)}
                    onPointerLeave={() => handleLeave()}
                />
                <use
                    href="#inner-seg"
                    className="nav-sector"
                    fill="#DFCCAF"
                    transform="rotate(180, 100, 100)"
                    onClick={() => handleClick(DIRECTION.CLOSE_NORTH_EAST)}
                    onPointerEnter={() => handleEnter(DIRECTION.CLOSE_NORTH_EAST)}
                    onPointerLeave={() => handleLeave()}
                />
                <use
                    href="#inner-seg"
                    className="nav-sector"
                    fill="#BE9B7B"
                    transform="rotate(270, 100, 100)"
                    onClick={() => handleClick(DIRECTION.CLOSE_NORTH_WEST)}
                    onPointerEnter={() => handleEnter(DIRECTION.CLOSE_NORTH_WEST)}
                    onPointerLeave={() => handleLeave()}
                />
            </svg>
        </div>
    );
}