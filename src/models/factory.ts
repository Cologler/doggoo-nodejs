'use strict';

import { EventEmitter } from "events";

import { JSDOM } from 'jsdom';
import { ioc } from 'anyioc';

import { setAttr, AttrSymbols } from '../utils/attrs';
import { Events } from "../const";

export class ElementFactory {
    private _eventEmitter: EventEmitter;
    private _dom: JSDOM;
    private _document: Document;
    private _imageIndex: number = 0;

    constructor() {
        this._eventEmitter = ioc.getRequired<EventEmitter>('event-emitter');
        this._dom = ioc.getRequired<JSDOM>('dom');
        this._document = this._dom.window.document;
    }

    createLineBreak() {
        const node = this._document.createElement('br');
        return node;
    }

    createTextNode(text: string) {
        return this._document.createTextNode(text);
    }

    createText() {
        const node = this._document.createElement('p');
        return node;
    }

    createImage(url: string) {
        const node = this._document.createElement('img');
        setAttr(node, AttrSymbols.RawUrl, url);
        setAttr(node, AttrSymbols.ImageIndex, this._imageIndex);
        this._imageIndex++;

        this._eventEmitter.emit(Events.addImage, this, {
            image: node
        });
        return node;
    }

    createLink(title: string, url: string) {
        const node = this._document.createElement('a');
        node.textContent = title;
        node.setAttribute('href', url);
        return node;
    }
}

ioc.registerSingleton(ElementFactory, () => new ElementFactory());
