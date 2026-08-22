import { useEffect, useState } from "react";
import { useEditorStore } from "../../store/editorStore";

import styles from "./PressureControl.module.css";

export function PressureControl() {
    const paintValue = useEditorStore((state) => state.paintValue);
    const [active, setActive] = useState(false);

    useEffect(() => {
        function handleClick() {
            if (!active) {
                return;
            }

            setActive(false);
        }

        document.addEventListener("click", handleClick);

        return () => {
            document.removeEventListener("click", handleClick);
        };
    }, [active, setActive]); // Empty dependency array => run once on mount

    function handleOpenPressure(e: React.MouseEvent): void {
        setActive(!active);
        e.stopPropagation();
    }

    function handleValueRangeChange(value: string): void {
        useEditorStore.getState().setPaintValue(parseFloat(value));
    }

    function renderRangePopover() {
        if (!active) {
            return;
        }

        return (
            <div className={styles.overlay}>
                <input
                    className={styles.range}
                    type="range"
                    min="0"
                    max="1"
                    defaultValue={paintValue}
                    step="0.01"
                    onChange={(e) => handleValueRangeChange(e.target.value)}
                />
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.inner}>
                <span>Value:</span><button className={styles.toggle} onClick={(e) => handleOpenPressure(e)}>{paintValue}</button>
            </div>
            {renderRangePopover()}
        </div>
    );
}