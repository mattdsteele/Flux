

    function FitRecord() {
        function isHeader(record) {
            return equals(RecordType.header, record.type);
        }
        function isDefinition(record) {
            return equals(RecordType.definition, record.type);
        }
        function isData(record) {
            return equals(RecordType.data, record.type);
        }
        function isCRC(record) {
            return equals(RecordType.crc, record.type);
        }

        // FitRecord, Value{}, DataView, Int -> DataView
        function encode(definition, values = {}, view, i = 0) {
            if(isHeader(definition)) {
                return fileHeader.encode(definition, view, i);
            }
            if(isDefinition(definition)) {
                return definitionRecord.encode(definition, view, i);
            }
            if(isData(definition)) {
                return dataRecord.encode(definition, values, view, i);
            }
            if(isCRC(definition)) {
                return CRC.encode(view, i);
            }
            console.warn(`Unknown RecordType ${definition.type}`, definition);
            return view;
        }

        // DataView, Int, Map -> FitRecord
        function decode(view, i = 0, definitions = new Map()) {
            const header = recordHeader.decode(view.getUint8(i, true));

            if(CRC.isCRC(view, i)) {
                return CRC.decode(view, i);
            }
            if(fileHeader.isFileHeader(view, i)) {
                return fileHeader.decode(view, i);
            }
            if(recordHeader.isDefinition(header)) {
                return definitionRecord.decode(view, i);
            }
            if(recordHeader.isData(header)) {
                const definition = definitions.get(header.local_number);
                return definitionRecord.decode(definition, view, i);
            }
            return {};
        }

        return Object.freeze({
            encode,
            decode,
        });
    }

    function File(args = {}) {
        const recordHeaderSize     = recordHeader.size;
        const fileHeaderSize       = fileHeader.defaultSize;
        const fileHeaderLegacySize = fileHeader.legacySize;
        const fileCrcSize          = CRC.size;

        function toDefinitions(activity) {
            return activity.reduce((acc, msg) => {
                if(equals(msg.type, 'definition')) {
                    acc[msg.local_number] = msg;
                    return acc;
                }
                return acc;
            }, {});
        }

        function toFileLength(activity, definitions) {
            return activity.reduce((acc, record) => {
                if(equals(record.type, RecordType.header)) {
                    return acc + record.length;
                }
                if(equals(record.type, RecordType.definition)) {
                    return acc + record.length;
                }
                if(equals(record.type, RecordType.data)) {
                    let definition = definitions[record.local_number];
                    return acc + definition.data_msg_length;
                }
                if(equals(record.type, RecordType.crc)) {
                    return acc + crc.size;
                };
                return acc;
            }, 0);
        }

        // [FitRecord]
        // ->
        // DataView
        function encode(activity) {
            const definitions       = toDefinitions(activity);
            const fileLength        = toFileLength(activity, definitions);
            const headerLength      = activity[0].length;
            const dataRecordsLength = fileLength - headerLength - CRC.size;

            const uint8Array = new Uint8Array(fileLength);
            const view       = new DataView(uint8Array.buffer);

            let i = 0;

            // - assign dataRecordsLength to FileHeader
            activity.reduce((acc, record) => {
                // if(equals(record.type, RecordType.data)) {
                //     const encoded = data.encode(
                //         definitions[record.local_number], record.fields
                //     );
                //     uint8Array.set(encoded, index);
                //     index += encoded.byteLength;
                // }
                i += record.length;
                return fitRecord.encode(record, acc, i);
            }, view);

            // calculate and write crc
            // const fileCRC = crc.calculate(uint8, 0, fileLength - crc.size);
            // view.setUint16(fileLength - crc.size, fileCRC, true);

            return view;
        }

        // DataVeiw -> [FitRecord]
        function decode(view) {
            // Note:
            // - RGT uses the same local_number 0 for all definitions
            // - Zwift often produces unfinished files with broken file headers
            const fileLength = view.byteLength;
            let i            = 0;
            let records      = [];
            let definitions  = new Map();

            while(i < fileLength) {
                try {
                    const record = fitRecord.decode(view, i, definitions);
                    records.push(record);
                    i += record.length;

                    if(fitRecord.isDefinition(record)) {
                        definitions.set(record.local_number, record);
                    }
                } catch(e) {
                    console.error(`error ${i}/${fileLength}`, e);
                    break;
                }
            }

            return records;
        }

        return Object.freeze({
            decode,
            encode,
            toDefinitions,
            toFileLength,
        });
    }

    // const activity  = Activity();
    const fitRecord = FitRecord();
    const file      = File();