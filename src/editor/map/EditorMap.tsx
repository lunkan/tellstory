import { useEffect, useRef, useState } from "react";
import { CanvasRenderer } from "../canvas/CanvasRenderer";
import { HydrationScheduler } from "../canvas/HydrationScheduler";
import { SelectedEntity, useEditorStore } from "../../store/editorStore";
import { DrawHandler } from "../event-handlers/DrawHandler";
import { MoveHandler } from "../event-handlers/MoveHandler";
import { SelectHandler } from "../event-handlers/SelectHandler";
import { ZoomHandler } from "../event-handlers/ZoomHandler";
import { DrawLineHandler } from '../event-handlers/DrawLineHandler';
import { MarkerHandler } from '../event-handlers/MarkerHandler';
import { EditorMapZoomLevel } from './zoom-level/EditorMapZoomLevel';

import styles from "./EditorMap.module.css";
import { MarkerConfig } from "../../../engine/config/type";

export function EditorMap() {
    const world = useEditorStore((state) => state.world);
    const editState = useEditorStore((state) => state.editState);
    const nodeDepth = useEditorStore((state) => state.nodeDepth);
    const setNodeDepth = useEditorStore((state) => state.setNodeDepth);
    const paintValue = useEditorStore((state) => state.paintValue);
    const selectedTerrain = useEditorStore((state) => state.selectedTerrain);
    const selectedNode = useEditorStore((state) => state.selectNode);
    const mapMode = useEditorStore((state) => state.mapMode);
    const viewportRef = useRef<HTMLDivElement>(null);
    const viewportSizeObserver = useRef<ResizeObserver | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<CanvasRenderer | null>(null);
    const schedulerRef = useRef<HydrationScheduler | null>(null);

    useEffect(() => {
        if (world && canvasRef.current && overlayRef.current && !rendererRef.current) {

            const initalZoom = Math.floor(Math.sqrt(world.maxZoomDepth));
            const canvasRenderer = new CanvasRenderer({
                world,
                initalZoom,
                canvas: canvasRef.current,
                overlay: overlayRef.current,
                renderMode: mapMode,
            });

            const hydrationScheduler = new HydrationScheduler(canvasRenderer);
            const unsubscribe = canvasRenderer.subscribe((request) => {
                if (request.trigger === 'zoom') {
                    const depth = Math.floor(Math.sqrt(canvasRenderer.scale)) + canvasRenderer.minDepth;
                    setNodeDepth(depth);
                }
            });

            rendererRef.current = canvasRenderer;
            schedulerRef.current = hydrationScheduler;
            canvasRenderer.clear();

            return () => {
                unsubscribe();
                hydrationScheduler.dispose?.();
                canvasRenderer.dispose?.();

                rendererRef.current = null;
                schedulerRef.current = null;
            }
        }
    }, [world, mapMode, setNodeDepth]);

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

    useEffect(() => {
        if (rendererRef.current) {
            rendererRef.current.setRenderMode(mapMode);
        }

    }, [mapMode]);

    useEffect(() => {
        if (rendererRef.current) {
            rendererRef.current.setDepth(nodeDepth);
        }

    }, [nodeDepth]);

    function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
        if (!canvasRef.current || !rendererRef.current || !viewportRef.current) {
            return;
        }

        const point = new DOMPoint(e.clientX, e.clientY);

        switch (editState) {
            case 'select':
                new SelectHandler(rendererRef.current, point, selectedNode);
                break;
            case 'transform':
                new MoveHandler(rendererRef.current, point);
                break;
            case 'draw':
                if (!selectedTerrain) {
                    return;
                } else if (selectedTerrain.category === 'marker') {
                    if (!world) {
                        return;
                    }
                    const markerConfig = selectedTerrain as MarkerConfig;
                    const insertDepth = world.getDepthFromScale(markerConfig.attention?.min || 0); // Needs setting
                    new MarkerHandler(insertDepth, markerConfig, rendererRef.current, point, e.button === 2);
                } else if (selectedTerrain.category === 'vector') {
                    new DrawLineHandler(selectedTerrain as SelectedEntity, paintValue, rendererRef.current, point, e.button === 2);
                } else {
                    new DrawHandler(selectedTerrain as SelectedEntity, paintValue, rendererRef.current, point);
                }
        }
    }

    function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
        if (rendererRef.current) {
            const wheelDelta = (e.nativeEvent as any).wheelDelta;
            new ZoomHandler(rendererRef.current).onWheel(wheelDelta, new DOMPoint(e.clientX, e.clientY));
        }
    }

    return (
        <div className={styles.map} style={{ position: 'relative' }} ref={viewportRef} onPointerDown={(e) => handlePointerDown(e)} onWheel={(e) => handleWheel(e)} onContextMenu={(e) => e.preventDefault()}>
            <canvas width="1000" height="1000" ref={canvasRef}></canvas>
            <canvas style={{ position: 'absolute', top: 0, left: 0 }} width="1000" height="1000" ref={overlayRef}></canvas>
            <EditorMapZoomLevel></EditorMapZoomLevel>
        </div>
    );
}
