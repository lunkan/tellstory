import { useRef } from "react";
import { Typewriter } from "./Typewriter";
import { useSceneStore } from "../../store/sceneStore";
import { useSnapScrollToBottom } from "../../effects/snapScrollToBottom";

export function DescriptionFeed() {
    const description = useSceneStore((state) => state.description);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useSnapScrollToBottom(scrollContainerRef, bottomRef)

    function handleAnimationComplete(id: string): void {
        useSceneStore.getState().consumeDescription(id);
    }

    console.log('DescriptionFeed', description);

    if (!description) {
        return;
    }

    return (
        <div className="feed" ref={scrollContainerRef}>
            <div className="feed--shade"></div>
            <div>
                <h2 className="feed--heading">{description.type}</h2>
                <Typewriter id={description.id} text={description.text} onAnimationComplete={handleAnimationComplete}></Typewriter>
            </div>
            <div ref={bottomRef}></div>
        </div>
    );
}

/*export function DescriptionFeed() {
    const {
        sceneId,
        leadingText,
        sceneTransition,
        quadrantSummary,
        adjacentSummary,
        directionAttention,
    } = useScene();
    const sceneReadyForInteraction = useSceneStore((state) => state.sceneReadyForInteraction);
    const [currentSceneId, setCurrentSceneId] = useState('');
    const [sceneTransitionCompleted, setSceneTransitionCompleted] = useState(false);
    const [quadrantSummaryCompleted, setQuadrantSummaryCompleted] = useState(false);
    const [adjacentSummaryCompleted, setAdjacentSummaryCompleted] = useState(false);
    const setSceneReadyForInteraction = useSceneStore((state) => state.setSceneReadyForInteraction);
    const setSceneIntroductionComplete = useSceneStore((state) => state.setSceneIntroductionComplete);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) {
                bottomRef.current?.scrollIntoView();
            }
        }, {
            root: scrollContainerRef.current,
            threshold: 0,
        });

        const bottom = bottomRef.current;
        if (bottom) observer.observe(bottom);

        return () => observer.disconnect();
    }, [scrollContainerRef, bottomRef]);

    useEffect(() => {
        if (!sceneId) {
            return;
        } else if (sceneId !== currentSceneId) {
            console.log('clear');
            setCurrentSceneId(sceneId);
            setSceneTransitionCompleted(false);
            setQuadrantSummaryCompleted(false);
            setSceneIntroductionComplete(false);
            setSceneReadyForInteraction(false);
            return;
        }

        if (sceneTransitionCompleted) {
            console.log('Introduction complete');
            setSceneIntroductionComplete(true);
        }

        if (sceneTransitionCompleted && quadrantSummaryCompleted && adjacentSummaryCompleted) {
            console.log('Ready for interaction');
            setSceneReadyForInteraction(true);
        }

    }, [setSceneReadyForInteraction, sceneId, currentSceneId, sceneTransitionCompleted, quadrantSummaryCompleted, adjacentSummaryCompleted]);

    function handleAnimationComplete(type: string): void {
        switch (type) {
            case 'sceneTransition':
                setSceneTransitionCompleted(true);
                break;
            case 'quadrantSummary':
                setQuadrantSummaryCompleted(true);
                break;
            case 'adjacentSummary':
                setAdjacentSummaryCompleted(true);
                break;
        }
    }

    function renderLoader() {
        return (
            <svg fill="#333" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ width: '14px', height: '14px' }}>
                <circle cx="4" cy="12" r="3">
                    <animate id="spinner_qFRN" begin="0;spinner_OcgL.end+0.25s" attributeName="cy" calcMode="spline" dur="0.6s" values="12;6;12" keySplines=".33,.66,.66,1;.33,0,.66,.33" />
                </circle>
                <circle cx="12" cy="12" r="3"><animate begin="spinner_qFRN.begin+0.1s" attributeName="cy" calcMode="spline" dur="0.6s" values="12;6;12" keySplines=".33,.66,.66,1;.33,0,.66,.33" /></circle>
                <circle cx="20" cy="12" r="3"><animate id="spinner_OcgL" begin="spinner_qFRN.begin+0.2s" attributeName="cy" calcMode="spline" dur="0.6s" values="12;6;12" keySplines=".33,.66,.66,1;.33,0,.66,.33" /></circle>
            </svg>
        );
    }

    function renderSceneTransition() {
        if (!sceneTransition?.text) {
            return (
                <div>
                    <h2 className="feed--heading">{leadingText}</h2>
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

    function renderDirectionAttention() {
        if (!sceneReadyForInteraction || !adjacentSummaryCompleted || !directionAttention?.text) {
            return null;
        }

        return (
            <div>
                <h2 className="feed--heading">Direction attention</h2>
                <Typewriter type="adjacentSummary" text={directionAttention?.text}></Typewriter>
            </div>
        );
    }

    return (
        <div className="feed" ref={scrollContainerRef}>
            <div className="feed--shade"></div>
            {renderSceneTransition()}
            {renderQuadrantSummary()}
            {renderAdjacentSummary()}
            {renderDirectionAttention()}
            <div ref={bottomRef}></div>
        </div>
    );
}*/
