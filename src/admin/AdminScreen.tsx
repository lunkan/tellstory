import pageStyles from "../styles/layout/Page.module.css";
import blockStyles from "../styles/layout/Block.module.css";
import cardStyles from "../styles/components/Card.module.css";
import sectionHeaderStyles from "../styles/components/SectionHeader.module.css";
import formFieldStyles from "../styles/components/FormField.module.css";
import buttonStyles from "../styles/components/Button.module.css";
import displayStyles from "../styles/typeography/Display.module.css";
import React from "react";
import { useNavigate } from "react-router-dom";
import { adminRepository } from "../repositories/adminRepository";
import { useSettingsStore } from "../store/settingsStore";

type AIFeatureType = 'instructionsOnly' | 'personalized' | 'narrator';

/*type AIFeatureState = {
    instructionsOnly: boolean;
    personalized: boolean;
    narrator: boolean;
};*/

export function AdminScreen() {
    const navigate = useNavigate();
    const configSettings = useSettingsStore((state) => state.config);
    const settings = useSettingsStore((state) => state.settings);

    /*const [aiFeatureStates, setAIFeatureStates] = useState<AIFeatureState>({
        instructionsOnly: false,
        personalized: true,
        narrator: true,
    });*/

    function handleClose(): void {
        navigate('/');
    }

    async function handleClearCache(): Promise<void> {
        await adminRepository.clearStorage('cache');
    }

    /*async function updateAIFeatureState(state: AIFeatureState): Promise<void> {
        setAIFeatureStates(state);
        await adminRepository.config(state);
    }*/

    function handleAIFeatureChange(type: AIFeatureType, e: React.ChangeEvent<HTMLInputElement>): void {
        const isChecked = e.target.checked;
        switch (type) {
            case 'instructionsOnly':
                configSettings({
                    descriptionInstructionsOnly: isChecked,
                    descriptionPersonalized: !isChecked,
                    descriptionNarrator: !isChecked,
                });

                /*updateAIFeatureState({
                    instructionsOnly: isChecked,
                    personalized: !isChecked,
                    narrator: !isChecked,
                });*/
                break;
            case 'personalized':
                configSettings({
                    descriptionInstructionsOnly: !settings.descriptionNarrator && !isChecked,
                    descriptionPersonalized: isChecked,
                });

                /*updateAIFeatureState({
                    ...aiFeatureStates,
                    instructionsOnly: !aiFeatureStates.narrator && !isChecked,
                    personalized: isChecked,
                });*/

                break;
            case 'narrator':
                configSettings({
                    descriptionInstructionsOnly: !settings.descriptionNarrator && !isChecked,
                    descriptionNarrator: isChecked,
                });

                /*updateAIFeatureState({
                    ...aiFeatureStates,
                    instructionsOnly: !aiFeatureStates.personalized && !isChecked,
                    narrator: isChecked,
                });*/
                break;
        }
    }

    return (
        <main className={pageStyles.page}>
            <div className={cardStyles.card}>
                <div className={sectionHeaderStyles.sectionHeader}>
                    <h2 className={displayStyles.display2}>Admin</h2>
                    <button className={buttonStyles.closeButton} onClick={() => handleClose()}>&#x2715;</button>
                </div>
                <div className={blockStyles.block}>
                    <h3 className={displayStyles.display3}>AI Features</h3>
                    <div className={formFieldStyles.formField}>
                        <input type="checkbox" id="instructionsOnly" className="test" checked={settings.descriptionInstructionsOnly} onChange={(e) => handleAIFeatureChange('instructionsOnly', e)} />
                        <label htmlFor="instructionsOnly" className="label">Instructions Only</label>
                    </div>
                    <div className={formFieldStyles.formField}>
                        <input type="checkbox" id="personalized" className="test" checked={settings.descriptionPersonalized} onChange={(e) => handleAIFeatureChange('personalized', e)} />
                        <label htmlFor="personalized" className="label">Personalized descriptions</label>
                    </div>
                    <div className={formFieldStyles.formField}>
                        <input type="checkbox" id="narrator" className="test" checked={settings.descriptionNarrator} onChange={(e) => handleAIFeatureChange('narrator', e)} />
                        <label htmlFor="narrator" className="label">Use narrator</label>
                    </div>
                </div>
                <div className={blockStyles.block}>
                    <h3 className={displayStyles.display3}>Cache managment</h3>
                    <button className={buttonStyles.button} onClick={() => handleClearCache()}>Clear cache</button>
                </div>
            </div>
        </main>
    );
}