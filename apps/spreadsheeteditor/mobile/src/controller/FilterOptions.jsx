import React, { useEffect,useState } from 'react';
import FilterOptions from '../../src/view/FilterOptions';
import { f7,Sheet,Popover } from 'framework7-react';
import { Device } from '../../../../common/mobile/utils/device';
import { useTranslation } from 'react-i18next';

const FilterOptionsController = () => {
    const { t } = useTranslation();
    const _t = t('View.Edit', {returnObjects: true});

    const [configFilter, setConfig] = useState(null);
    const [listVal, setListValue] = useState([]);
    
    let selectedCells = listVal.filter(item => item.check === true).length;
    
    const onClosed = () => {
        if(selectedCells === 0) { 
            f7.dialog.create({
                title: _t.textErrorTitle,
                text: _t.textErrorMsg,
                buttons: [
                    {
                        text: 'OK',
                    }
                ]
            }).open();
        }
    }
    
    useEffect(() => {
        function onDocumentReady()  {
            const api = Common.EditorApi.get();
            api.asc_registerCallback('asc_onSetAFDialog',onApiFilterOptions);
        }
        
        if ( !Common.EditorApi ) {
            Common.Notifications.on('document:ready',onDocumentReady);
        } else {
            onDocumentReady();
        }

        return () => { 
            Common.Notifications.off('document:ready', onDocumentReady);
            const api = Common.EditorApi.get();
            api.asc_unregisterCallback('asc_onSetAFDialog',onApiFilterOptions);
        }

    }, []);

    const onApiFilterOptions= (config) => {
        let rect = config.asc_getCellCoord(),
        posX = rect.asc_getX() + rect.asc_getWidth() - 9,
        posY = rect.asc_getY() + rect.asc_getHeight() - 9;
        setDataFilterCells(config);
        setConfig(config);
        setClearDisable(config);
        if (Device.phone) { 
            f7.sheet.open('.picker__sheet');
        } else {
            let $target = $$('#idx-context-menu-target')
                        .css({left: `${posX}px`, top: `${posY}px`});
            f7.popover.open('#picker-popover',$target);
        }    
    }

    const onSort = (type) => {
        const api = Common.EditorApi.get();
        api.asc_sortColFilter(type == 'sortdown' ? Asc.c_oAscSortOptions.Ascending : Asc.c_oAscSortOptions.Descending, configFilter.asc_getCellId(), configFilter.asc_getDisplayName(), undefined, true);
    }
    
    const onClearFilter = () => {
        const api = Common.EditorApi.get();
        if(api) api.asc_clearFilter();
    }

    const onDeleteFilter = () => {
        const api = Common.EditorApi.get();
        let formatTableInfo = api.asc_getCellInfo().asc_getFormatTableInfo();
        let tablename = (formatTableInfo) ? formatTableInfo.asc_getTableName() : undefined;
        if(api) {
            api.asc_changeAutoFilter(tablename, Asc.c_oAscChangeFilterOptions.filter, false);
            f7.sheet.close('.picker__sheet');
            f7.popover.close('#picker-popover');
        }
    }

    const setClearDisable = (config) => {
        let $clearFilter = $$("#button-clear-filter");
        let arr = config.asc_getValues();
        let lenCheck = arr.filter((item) => {return item.visible == true}).length;
        lenCheck == arr.length ?  $clearFilter.addClass('disabled') : $clearFilter.removeClass('disabled'); 
    }

    const setDataFilterCells = (config) => {
        function isNumeric(value) {
            return !isNaN(parseFloat(value)) && isFinite(value);
        }

        let value = null,
            isnumber = null,
            index =0,
            throughIndex = 0,
            arrCells = [],
            idxs = [];

            config.asc_getValues().forEach(function (item) {
            value = item.asc_getText();
            isnumber = isNumeric(value);
            if(idxs[throughIndex] == undefined) idxs[throughIndex] = item.asc_getVisible();

            arrCells.push({     
                id              : index++,
                selected        : false,
                cellvalue       : value ? value : _t.textEmptyItem,
                value           : isnumber ? value : (value.length > 0 ? value: _t.textEmptyItem),
                groupid         : '1',
                check           : idxs[throughIndex]
                });
            ++throughIndex;
        });
        setListValue(arrCells);
    }
    
    const onUpdateCell = (id=[],state) =>{
        const api = Common.EditorApi.get();

        if(id.length > 0){
            configFilter.asc_getValues().forEach(item => {
                item.asc_setVisible(state);
            })
            setListValue([...listVal]);
            configFilter.asc_getFilterObj().asc_setType(Asc.c_oAscAutoFilterTypes.Filters);
            api.asc_applyAutoFilter(configFilter);
        } else if(id.length === 0) {
            listVal.forEach(item => item.check = state);
            setListValue([...listVal]);
        } else{
            if((listVal.filter(item => item.check === true).length === 0)) {
                listVal[id].check = state;
                setListValue([...listVal]);
                configFilter.asc_getValues().forEach((item,index) => item.asc_setVisible(listVal[index].check));
                api.asc_applyAutoFilter(configFilter);
            } else {
                listVal[id].check = state;
                setListValue([...listVal]);
                if((listVal.filter(item => item.check === true)).length){
                    configFilter.asc_getFilterObj().asc_setType(Asc.c_oAscAutoFilterTypes.Filters);
                    configFilter.asc_getValues()[id].asc_setVisible(state); 
                };
            api.asc_applyAutoFilter(configFilter);
            }
        }
        setClearDisable(configFilter);
    }
    
    return (
        !Device.phone ?
        <Popover id="picker-popover" className="popover__titled" onPopoverClosed={onClosed}>
            <FilterOptions style={{height: '410px'}} onSort={onSort} listVal={listVal} 
             onDeleteFilter={onDeleteFilter} onUpdateCell={onUpdateCell} onClearFilter={onClearFilter} />
        </Popover> :
        <Sheet className="picker__sheet" push onSheetClosed={onClosed}>
            <FilterOptions   onSort={onSort} listVal={listVal} 
             onUpdateCell={onUpdateCell} onDeleteFilter={onDeleteFilter} onClearFilter={onClearFilter}/>
        </Sheet>
    )
}

export default FilterOptionsController;