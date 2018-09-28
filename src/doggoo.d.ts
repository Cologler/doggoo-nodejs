import { FlowContext } from "anyflow";

import { AppOptions } from "./options";
import { Novel } from "./models/novel";

export interface AppInfo {
    name: string,
    build: string,
    buildtime: Date,
}

export interface FlowContextState {
    options: AppOptions,
    novel: Novel,
}

export type DoggooFlowContext = FlowContext<FlowContextState>;

export interface IGenerator {
    invoke(context: DoggooFlowContext): void;

    readonly requireImages: boolean;
}

export interface InfoBuilder {
    appinfo: string;
    source: string;
    format: string;

    toString(): string;
}

export interface IParser {
    readonly name: string;
}
