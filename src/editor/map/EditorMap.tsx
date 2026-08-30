import { useEffect, useRef, useState } from "react";
import { CanvasRenderer } from "../canvas/CanvasRenderer";
import { useEditorStore } from "../../store/editorStore";
import { DrawHandler } from "../event-handlers/DrawHandler";
import { MoveHandler } from "../event-handlers/MoveHandler";
import { SelectHandler } from "../event-handlers/SelectHandler";
import { ZoomHandler } from "../event-handlers/ZoomHandler";
import { DrawLineHandler } from '../event-handlers/DrawLineHandler';
import { MarkerHandler } from '../event-handlers/MarkerHandler';
import { EditorMapZoomLevel } from './zoom-level/EditorMapZoomLevel';

import styles from "./EditorMap.module.css";

export function EditorMap() {
    //const quadtree = useEditorStore((state) => state.quadtree);
    //const markers = useEditorStore((state) => state.markers);
    const world = useEditorStore((state) => state.world);
    const editState = useEditorStore((state) => state.editState);
    const paintValue = useEditorStore((state) => state.paintValue);
    const selectedTerrain = useEditorStore((state) => state.selectedTerrain);
    const viewportRef = useRef<HTMLDivElement>(null);
    const viewportSizeObserver = useRef<ResizeObserver | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<CanvasRenderer | null>(null);
    const [depth, setDepth] = useState<number>(5);

    useEffect(() => {
        if (world && canvasRef.current && overlayRef.current && !rendererRef.current) {
            rendererRef.current = new CanvasRenderer(world, canvasRef.current, overlayRef.current);
            rendererRef.current.clear();
        }

        /*if (markers && quadtree && canvasRef.current && overlayRef.current && !rendererRef.current) {
            rendererRef.current = new CanvasRenderer(quadtree, markers, canvasRef.current, overlayRef.current);
            rendererRef.current.clear();
        }*/
    }, []);

    useEffect(() => {
        if (viewportRef.current && !viewportSizeObserver.current) {
            viewportSizeObserver.current = new ResizeObserver((entries) => {
                const lastChange = entries.pop();
                const viewportWidth = lastChange?.contentRect.width;
                const viewportHeight = lastChange?.contentRect.height;

                if (rendererRef.current && viewportWidth && viewportHeight) {
                    rendererRef.current.setViewport(viewportWidth, viewportHeight);
                }
            });

            viewportSizeObserver.current.observe(viewportRef.current);
        }
    }, []);

    function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
        if (!canvasRef.current || !rendererRef.current || !viewportRef.current) {
            return;
        }

        const point = new DOMPoint(e.clientX, e.clientY);

        switch (editState) {
            case 'select':
                new SelectHandler(rendererRef.current, point);
                break;
            case 'transform':
                new MoveHandler(rendererRef.current, point);
                break;
            case 'draw':
                if (!selectedTerrain) {
                    return;
                } else if (selectedTerrain.category === 'marker') {
                    new MarkerHandler(selectedTerrain, rendererRef.current, point, e.button === 2);
                } else if (selectedTerrain.category === 'vector') {
                    new DrawLineHandler(selectedTerrain, paintValue, rendererRef.current, point, e.button === 2);
                } else {
                    new DrawHandler(selectedTerrain, paintValue, rendererRef.current, point);
                }
        }
    }

    function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
        if (rendererRef.current) {
            const wheelDelta = (e.nativeEvent as any).wheelDelta;
            new ZoomHandler(rendererRef.current).onWheel(wheelDelta, new DOMPoint(e.clientX, e.clientY));

            const depth = Math.floor(Math.sqrt(rendererRef.current.scale)) + 5;
            rendererRef.current.setDepth(depth);
            setDepth(rendererRef.current.getDepth());
        }
    }

    return (
        <div className={styles.map} style={{ position: 'relative' }} ref={viewportRef} onPointerDown={(e) => handlePointerDown(e)} onWheel={(e) => handleWheel(e)}>
            <canvas width="1000" height="1000" ref={canvasRef}></canvas>
            <canvas style={{ position: 'absolute', top: 0, left: 0 }} width="1000" height="1000" ref={overlayRef}></canvas>
            <EditorMapZoomLevel depth={depth}></EditorMapZoomLevel>
        </div>
    );
}