import { useState } from "react";
import { useLocationStore } from "./store/locationStore";
import { Typewriter } from "./Typewriter";

export function NewFeed() {
    const messageQueue = useLocationStore((state) => state.messageQueue);
    const [sceneId, setSceneId] = useState('');
    const [sceneTransitionCompleted, setSceneTransitionCompleted] = useState(false);
    const [quadrantSummaryCompleted, setQuadrantSummaryCompleted] = useState(false);

    const scene = messageQueue.find((message) => message.descriptionType === 'enter');
    if (!scene) {
         return (<div>No scene</div>);
    } else if (sceneId !== scene.eventId) {
        setSceneId(scene.eventId);
        setSceneTransitionCompleted(false);
        setQuadrantSummaryCompleted(false);
    }

    const messagesByScene = messageQueue.filter((message) => message.eventId === scene.eventId);
    const sceneTransition = messagesByScene.find((message) => message.descriptionType === 'sceneTransition');
    const quadrantSummary = messagesByScene.find((message) => message.descriptionType === 'quadrantSummary');
    const adjacentSummary = messagesByScene.find((message) => message.descriptionType === 'adjacentSummary');

    function handleAnimationComplete(type: string): void {
        switch(type) {
            case 'sceneTransition':
                setSceneTransitionCompleted(true);
                break;
            case 'quadrantSummary':
                setQuadrantSummaryCompleted(true);
                break;
        }
    }   

    function renderLoader() {
        return (
            <svg fill="#333" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{width: '14px', height: '14px'}}>
                <circle cx="4" cy="12" r="3">
                    <animate id="spinner_qFRN" begin="0;spinner_OcgL.end+0.25s" attributeName="cy" calcMode="spline" dur="0.6s" values="12;6;12" keySplines=".33,.66,.66,1;.33,0,.66,.33"/>
                </circle>
                <circle cx="12" cy="12" r="3"><animate begin="spinner_qFRN.begin+0.1s" attributeName="cy" calcMode="spline" dur="0.6s" values="12;6;12" keySplines=".33,.66,.66,1;.33,0,.66,.33"/></circle>
                <circle cx="20" cy="12" r="3"><animate id="spinner_OcgL" begin="spinner_qFRN.begin+0.2s" attributeName="cy" calcMode="spline" dur="0.6s" values="12;6;12" keySplines=".33,.66,.66,1;.33,0,.66,.33"/></circle>
            </svg>
        );
    }

    function renderSceneTransition() {
        if (!sceneTransition?.text) {
            return (
                <div>
                    <h2 className="feed--heading">{scene?.text}</h2>
                    <div>{renderLoader()}</div>
                </div>
            );
        }

        return (
            <div>
                <h2 className="feed--heading">Scene transition</h2>
                <Typewriter type="sceneTransition" text={sceneTransition.text} onAnimationComplete={handleAnimationComplete}></Typewriter>
            </div>
        );
    }

    function renderQuadrantSummary() {
        if (!sceneTransitionCompleted) {
            return null;
        } else if (!quadrantSummary?.text) {    
            return renderLoader();
        }

        return (
            <div>
                <h2 className="feed--heading">Quadrant summary</h2>
                <Typewriter type="quadrantSummary" text={quadrantSummary.text} onAnimationComplete={handleAnimationComplete}></Typewriter>
            </div>
        );
    }

    function renderAdjacentSummary() {
        if (!sceneTransitionCompleted || !quadrantSummaryCompleted) {
            return null;
        } else if (!adjacentSummary?.text) {    
            return renderLoader();
        }

        return (
            <div>
                <h2 className="feed--heading">Adjacent summary</h2>
                <Typewriter type="adjacentSummary" text={adjacentSummary?.text} onAnimationComplete={handleAnimationComplete}></Typewriter>
            </div>
        );
    }

    return (
        <div>
            {renderSceneTransition()}
            {renderQuadrantSummary()}
            {renderAdjacentSummary()}
        </div>
    );
}