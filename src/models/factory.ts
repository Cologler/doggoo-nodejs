'use strict';

import { EventEmitter } from "events";

import { JSDOM } from 'jsdom';
import { ioc } from 'anyioc';

import { Events } from "../const";
import { Elements } from './elements';

export class ElementFactory {
    private _eventEmitter: EventEmitter;
    private _imageIndex: number = 0;

    constructor() {
        this._eventEmitter = ioc.getRequired<EventEmitter>('event-emitter');
    }

    createLineBreak() {
        return new Elements.LineBreak();
    }

    createText(text: string) {
        return new Elements.Text(text);
    }

    createLine() {
        return new Elements.Line();
    }

    createImage(url: string) {
        const image = new Elements.Image();
        image.Uri = url;
        image.Index = this._imageIndex;
        this._imageIndex++;

        this._eventEmitter.emit(Events.addImage, this, {
            image: image
        });
        return image;
    }

    createLink(title: string, url: string) {
        const link = new Elements.Link();
        link.Title = title;
        link.Url = url;
        return link;
    }
}

ioc.registerSingleton(ElementFactory, () => new ElementFactory());
