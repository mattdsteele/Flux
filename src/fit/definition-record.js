import { equals, first, second, third, nthBit, f, expect } from '../functions.js';
import { BaseType, BaseTypeDefinitions, } from './base-types.js';

import {
    HeaderType, RecordType,
    getField, setField,
    ValueParser, identityParser,
} from './common.js';
import { profiles } from './profiles.js';
import { recordHeader } from './record-header.js';
import { fieldDefinition } from './field-definition.js';

function DefinitionRecord(args = {}) {
    const _type               = RecordType.definition;
    const headerSize          = recordHeader.size;
    const fixedContentLength  = 6;
    const fieldLength         = 3;
    const architecture        = (args.architecture ?? true) ? 0 : 1;
    const numberOfFieldsIndex = 5;

    function numberToMessageName(number) {
        return profiles.numberToMessageName(number);
    }

    function messageNameToNumber(messageName) {
        return profiles.messageNameToNumber(messageName);
    }

    function getDefinitionRecordLength(view, start = 0) {
        const numberOfFields    = readNumberOfFields(view, start);
        const numberOfDevFields = readNumberOfDevFields(view, start);

        return fixedContentLength +
            (numberOfFields * fieldLength) +
            (numberOfDevFields > 0 ? 1 : 0) +
            (numberOfDevFields * fieldLength);
    }

    function getDataRecordLength(fields) {
        return headerSize + fields.reduce((acc, x) => acc + x.size, 0);
    }

    function readNumberOfFields(view, start = 0) {
        return view.getUint8(start + numberOfFieldsIndex, true);
    }

    function readNumberOfDevFields(view, start = 0) {
        const header = recordHeader.decode(view.getUint8(start, true));
        if(recordHeader.isDeveloper(header)) {
            const numberOfFields = readNumberOfFields(view, start);
            const index = start + fixedContentLength + (numberOfFields * fieldLength);

            return view.getUint8(index, true);
        }
        return 0;
    }

    // ['message_name', ['field_name'], Int]
    // ->
    // {
    //     type: RecordType
    //     architecture: Int,
    //     name: String,
    //     local_number: Int,
    //     length: Int,
    //     data_msg_length: Int,
    //     fields: [{number: Int, size: Int, base_type: base_type}]
    // }
    function productToFITjs(args = []) {
        const messageName    = first(args);
        const fieldNames     = second(args);
        const local_number   = third(args);
        const numberOfFields = fieldNames.length;

        const length = fixedContentLength + (numberOfFields * fieldLength);
        const fields = {};

        fieldNames.reduce(function(acc, fieldName) {
            const number    = profiles.fieldNameToNumber(messageName, fieldName);
            const size      = profiles.fieldNameToSize(fieldName);
            const base_type = profiles.fieldNameToBaseType(fieldName);
            acc[fieldName] = {number, size, base_type};
            return acc;
        }, fields);

        const data_msg_length = fields.reduce((acc, x) => acc + x.size, 1);

        return {
            type: _type,
            architecture,
            name: messageName,
            local_number,
            length,
            data_msg_length,
            fields,
        };
    }

    // {headerType: String, messageType: String, messageTypeSpecific: String, localMessageType: Int}

    // {name: String, local_number: Int, fields: [
    //     {number: Int, size: Int, base_type: BaseType}
    // ]}
    // -> DataView
    function encode(definition, view, i = 0) {
        console.log(_type);
        const header = recordHeader.encode({
            messageType:      _type,
            localMessageType: definition.local_number,
        });
        const numberOfFields = definition.fields.length;
        const globalNumber   = messageNameToNumber(definition.name);

        const length = fixedContentLength + (numberOfFields * fieldLength);

        view.setUint8( i+0, header,         true);
        view.setUint8( i+1, 0,              true);
        view.setUint8( i+2, architecture,   true);
        view.setUint16(i+3, globalNumber,   true);
        view.setUint8( i+5, numberOfFields, true);

        i = fixedContentLength;
        definition.fields.forEach((field) => {
            fieldDefinition.encode(field, view, i);
            i += fieldLength;
        });

        // TODO:
        // if developer fields are defined
        // write # developer fields
        // write developer fields definitions
        if('developerFields' in definition) {

            const numberOfDeveloperFields = definition.developerFields.length;

            view.setUint8(i, numberOfDeveloperFields, true);

            definition.developerFields.forEach((field) => {
                fieldDefinition.encode(field, view, i);
                i += fieldLength;
            });
        }

        return view;
    }

    // DataView,
    // Int
    // ->
    // {
    //     type: RecordType
    //     architecture: Int,
    //     name: String,
    //     local_number: Int,
    //     length: Int,
    //     data_record_length: Int,
    //     fields: [{number: Int, size: Int, base_type: BaseTypes}]
    // }
    function decode(view, start = 0) {
        const header            = recordHeader.decode(view.getUint8(start, true));
        const local_number      = header.localMessageType;
        const architecture      = view.getUint8(start+2, true);
        const littleEndian      = !architecture;
        const messageNumber     = view.getUint16(start+3, littleEndian);
        const messageName       = numberToMessageName(messageNumber);
        const numberOfFields    = readNumberOfFields(view, start);
        const numberOfDevFields = readNumberOfDevFields(view, start);
        const length            = getDefinitionRecordLength(view, start);

        let fields = [];
        let i = start + fixedContentLength;

        for(let f=0; f < numberOfFields; f++) {
            fields.push(fieldDefinition.decode(messageName, view, i,));
            i += fieldLength;
        }

        i+=1;

        for(let df=0; df < numberOfDevFields; df++) {
            fields.push(fieldDefinition.decode(messageName, view, i,));
            i += fieldLength;
        }

        const data_record_length = getDataRecordLength(fields);

        return {
            type: _type,
            architecture,
            name: messageName,
            local_number,
            length,
            data_record_length,
            fields,
        };
    }

    return Object.freeze({
        getDefinitionRecordLength,
        getDataRecordLength,
        productToFITjs,
        encode,
        decode,
    });
}

const definitionRecord = DefinitionRecord();

export {
    DefinitionRecord,
    definitionRecord,
};

