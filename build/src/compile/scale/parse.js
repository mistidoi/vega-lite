import { SCALE_CHANNELS, SHAPE, X, Y } from '../../channel';
import { getFieldDef, hasConditionalFieldDef, isFieldDef } from '../../fielddef';
import { GEOSHAPE } from '../../mark';
import { NON_TYPE_DOMAIN_RANGE_VEGA_SCALE_PROPERTIES, scaleCompatible, scaleTypePrecedence, } from '../../scale';
import { GEOJSON } from '../../type';
import { keys } from '../../util';
import { isUnitModel } from '../model';
import { defaultScaleResolve } from '../resolve';
import { mergeValuesWithExplicit, tieBreakByComparing } from '../split';
import { ScaleComponent } from './component';
import { parseScaleDomain } from './domain';
import { parseScaleProperty } from './properties';
import { parseScaleRange } from './range';
import { scaleType } from './type';
export function parseScale(model) {
    parseScaleCore(model);
    parseScaleDomain(model);
    for (var _i = 0, NON_TYPE_DOMAIN_RANGE_VEGA_SCALE_PROPERTIES_1 = NON_TYPE_DOMAIN_RANGE_VEGA_SCALE_PROPERTIES; _i < NON_TYPE_DOMAIN_RANGE_VEGA_SCALE_PROPERTIES_1.length; _i++) {
        var prop = NON_TYPE_DOMAIN_RANGE_VEGA_SCALE_PROPERTIES_1[_i];
        parseScaleProperty(model, prop);
    }
    // range depends on zero
    parseScaleRange(model);
}
export function parseScaleCore(model) {
    if (isUnitModel(model)) {
        model.component.scales = parseUnitScaleCore(model);
    }
    else {
        model.component.scales = parseNonUnitScaleCore(model);
    }
}
/**
 * Parse scales for all channels of a model.
 */
function parseUnitScaleCore(model) {
    var encoding = model.encoding, config = model.config, mark = model.mark;
    return SCALE_CHANNELS.reduce(function (scaleComponents, channel) {
        var fieldDef;
        var specifiedScale = undefined;
        var channelDef = encoding[channel];
        // Don't generate scale for shape of geoshape
        if (isFieldDef(channelDef) && mark === GEOSHAPE &&
            channel === SHAPE && channelDef.type === GEOJSON) {
            return scaleComponents;
        }
        if (isFieldDef(channelDef)) {
            fieldDef = channelDef;
            specifiedScale = channelDef.scale;
        }
        else if (hasConditionalFieldDef(channelDef)) {
            fieldDef = channelDef.condition;
            specifiedScale = channelDef.condition['scale']; // We use ['scale'] since we know that channel here has scale for sure
        }
        else if (channel === X) {
            fieldDef = getFieldDef(encoding.x2);
        }
        else if (channel === Y) {
            fieldDef = getFieldDef(encoding.y2);
        }
        if (fieldDef && specifiedScale !== null && specifiedScale !== false) {
            specifiedScale = specifiedScale || {};
            var specifiedScaleType = specifiedScale.type;
            var sType = scaleType(specifiedScale.type, channel, fieldDef, mark, config.scale);
            scaleComponents[channel] = new ScaleComponent(model.scaleName(channel + '', true), { value: sType, explicit: specifiedScaleType === sType });
        }
        return scaleComponents;
    }, {});
}
var scaleTypeTieBreaker = tieBreakByComparing(function (st1, st2) { return (scaleTypePrecedence(st1) - scaleTypePrecedence(st2)); });
function parseNonUnitScaleCore(model) {
    var scaleComponents = model.component.scales = {};
    var scaleTypeWithExplicitIndex = {};
    var resolve = model.component.resolve;
    var _loop_1 = function (child) {
        parseScaleCore(child);
        // Instead of always merging right away -- check if it is compatible to merge first!
        keys(child.component.scales).forEach(function (channel) {
            // if resolve is undefined, set default first
            resolve.scale[channel] = resolve.scale[channel] || defaultScaleResolve(channel, model);
            if (resolve.scale[channel] === 'shared') {
                var explicitScaleType = scaleTypeWithExplicitIndex[channel];
                var childScaleType = child.component.scales[channel].getWithExplicit('type');
                if (explicitScaleType) {
                    if (scaleCompatible(explicitScaleType.value, childScaleType.value)) {
                        // merge scale component if type are compatible
                        scaleTypeWithExplicitIndex[channel] = mergeValuesWithExplicit(explicitScaleType, childScaleType, 'type', 'scale', scaleTypeTieBreaker);
                    }
                    else {
                        // Otherwise, update conflicting channel to be independent
                        resolve.scale[channel] = 'independent';
                        // Remove from the index so they don't get merged
                        delete scaleTypeWithExplicitIndex[channel];
                    }
                }
                else {
                    scaleTypeWithExplicitIndex[channel] = childScaleType;
                }
            }
        });
    };
    // Parse each child scale and determine if a particular channel can be merged.
    for (var _i = 0, _a = model.children; _i < _a.length; _i++) {
        var child = _a[_i];
        _loop_1(child);
    }
    // Merge each channel listed in the index
    keys(scaleTypeWithExplicitIndex).forEach(function (channel) {
        // Create new merged scale component
        var name = model.scaleName(channel, true);
        var typeWithExplicit = scaleTypeWithExplicitIndex[channel];
        scaleComponents[channel] = new ScaleComponent(name, typeWithExplicit);
        // rename each child and mark them as merged
        for (var _i = 0, _a = model.children; _i < _a.length; _i++) {
            var child = _a[_i];
            var childScale = child.component.scales[channel];
            if (childScale) {
                child.renameScale(childScale.get('name'), name);
                childScale.merged = true;
            }
        }
    });
    return scaleComponents;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY29tcGlsZS9zY2FsZS9wYXJzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUMsY0FBYyxFQUFnQixLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN4RSxPQUFPLEVBQVcsV0FBVyxFQUFFLHNCQUFzQixFQUFFLFVBQVUsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3pGLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDcEMsT0FBTyxFQUNMLDJDQUEyQyxFQUUzQyxlQUFlLEVBRWYsbUJBQW1CLEdBQ3BCLE1BQU0sYUFBYSxDQUFDO0FBQ3JCLE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDbkMsT0FBTyxFQUFDLElBQUksRUFBQyxNQUFNLFlBQVksQ0FBQztBQUVoQyxPQUFPLEVBQUMsV0FBVyxFQUFRLE1BQU0sVUFBVSxDQUFDO0FBQzVDLE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUMvQyxPQUFPLEVBQVcsdUJBQXVCLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFFaEYsT0FBTyxFQUFDLGNBQWMsRUFBc0IsTUFBTSxhQUFhLENBQUM7QUFDaEUsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzFDLE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUNoRCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQ3hDLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFFakMsTUFBTSxxQkFBcUIsS0FBWTtJQUNyQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdEIsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDeEIsS0FBbUIsVUFB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b3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1NDQUxFX0NIQU5ORUxTLCBTY2FsZUNoYW5uZWwsIFNIQVBFLCBYLCBZfSBmcm9tICcuLi8uLi9jaGFubmVsJztcbmltcG9ydCB7RmllbGREZWYsIGdldEZpZWxkRGVmLCBoYXNDb25kaXRpb25hbEZpZWxkRGVmLCBpc0ZpZWxkRGVmfSBmcm9tICcuLi8uLi9maWVsZGRlZic7XG5pbXBvcnQge0dFT1NIQVBFfSBmcm9tICcuLi8uLi9tYXJrJztcbmltcG9ydCB7XG4gIE5PTl9UWVBFX0RPTUFJTl9SQU5HRV9WRUdBX1NDQUxFX1BST1BFUlRJRVMsXG4gIFNjYWxlLFxuICBzY2FsZUNvbXBhdGlibGUsXG4gIFNjYWxlVHlwZSxcbiAgc2NhbGVUeXBlUHJlY2VkZW5jZSxcbn0gZnJvbSAnLi4vLi4vc2NhbGUnO1xuaW1wb3J0IHtHRU9KU09OfSBmcm9tICcuLi8uLi90eXBlJztcbmltcG9ydCB7a2V5c30gZnJvbSAnLi4vLi4vdXRpbCc7XG5pbXBvcnQge1ZnU2NhbGV9IGZyb20gJy4uLy4uL3ZlZ2Euc2NoZW1hJztcbmltcG9ydCB7aXNVbml0TW9kZWwsIE1vZGVsfSBmcm9tICcuLi9tb2RlbCc7XG5pbXBvcnQge2RlZmF1bHRTY2FsZVJlc29sdmV9IGZyb20gJy4uL3Jlc29sdmUnO1xuaW1wb3J0IHtFeHBsaWNpdCwgbWVyZ2VWYWx1ZXNXaXRoRXhwbGljaXQsIHRpZUJyZWFrQnlDb21wYXJpbmd9IGZyb20gJy4uL3NwbGl0JztcbmltcG9ydCB7VW5pdE1vZGVsfSBmcm9tICcuLi91bml0JztcbmltcG9ydCB7U2NhbGVDb21wb25lbnQsIFNjYWxlQ29tcG9uZW50SW5kZXh9IGZyb20gJy4vY29tcG9uZW50JztcbmltcG9ydCB7cGFyc2VTY2FsZURvbWFpbn0gZnJvbSAnLi9kb21haW4nO1xuaW1wb3J0IHtwYXJzZVNjYWxlUHJvcGVydHl9IGZyb20gJy4vcHJvcGVydGllcyc7XG5pbXBvcnQge3BhcnNlU2NhbGVSYW5nZX0gZnJvbSAnLi9yYW5nZSc7XG5pbXBvcnQge3NjYWxlVHlwZX0gZnJvbSAnLi90eXBlJztcblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlU2NhbGUobW9kZWw6IE1vZGVsKSB7XG4gIHBhcnNlU2NhbGVDb3JlKG1vZGVsKTtcbiAgcGFyc2VTY2FsZURvbWFpbihtb2RlbCk7XG4gIGZvciAoY29uc3QgcHJvcCBvZiBOT05fVFlQRV9ET01BSU5fUkFOR0VfVkVHQV9TQ0FMRV9QUk9QRVJUSUVTKSB7XG4gICAgcGFyc2VTY2FsZVByb3BlcnR5KG1vZGVsLCBwcm9wKTtcbiAgfVxuICAvLyByYW5nZSBkZXBlbmRzIG9uIHplcm9cbiAgcGFyc2VTY2FsZVJhbmdlKG1vZGVsKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlU2NhbGVDb3JlKG1vZGVsOiBNb2RlbCkge1xuICBpZiAoaXNVbml0TW9kZWwobW9kZWwpKSB7XG4gICAgbW9kZWwuY29tcG9uZW50LnNjYWxlcyA9IHBhcnNlVW5pdFNjYWxlQ29yZShtb2RlbCk7XG4gIH0gZWxzZSB7XG4gICAgbW9kZWwuY29tcG9uZW50LnNjYWxlcyA9IHBhcnNlTm9uVW5pdFNjYWxlQ29yZShtb2RlbCk7XG4gIH1cbn1cblxuLyoqXG4gKiBQYXJzZSBzY2FsZXMgZm9yIGFsbCBjaGFubmVscyBvZiBhIG1vZGVsLlxuICovXG5mdW5jdGlvbiBwYXJzZVVuaXRTY2FsZUNvcmUobW9kZWw6IFVuaXRNb2RlbCk6IFNjYWxlQ29tcG9uZW50SW5kZXgge1xuICBjb25zdCB7ZW5jb2RpbmcsIGNvbmZpZywgbWFya30gPSBtb2RlbDtcblxuICByZXR1cm4gU0NBTEVfQ0hBTk5FTFMucmVkdWNlKChzY2FsZUNvbXBvbmVudHM6IFNjYWxlQ29tcG9uZW50SW5kZXgsIGNoYW5uZWw6IFNjYWxlQ2hhbm5lbCkgPT4ge1xuICAgIGxldCBmaWVsZERlZjogRmllbGREZWY8c3RyaW5nPjtcbiAgICBsZXQgc3BlY2lmaWVkU2NhbGU6IFNjYWxlIHwgbnVsbCA9IHVuZGVmaW5lZDtcblxuICAgIGNvbnN0IGNoYW5uZWxEZWYgPSBlbmNvZGluZ1tjaGFubmVsXTtcblxuICAgIC8vIERvbid0IGdlbmVyYXRlIHNjYWxlIGZvciBzaGFwZSBvZiBnZW9zaGFwZVxuICAgIGlmIChcbiAgICAgIGlzRmllbGREZWYoY2hhbm5lbERlZikgJiYgbWFyayA9PT0gR0VPU0hBUEUgJiZcbiAgICAgIGNoYW5uZWwgPT09IFNIQVBFICYmIGNoYW5uZWxEZWYudHlwZSA9PT0gR0VPSlNPTlxuICAgICkge1xuICAgICAgcmV0dXJuIHNjYWxlQ29tcG9uZW50cztcbiAgICB9XG5cbiAgICBpZiAoaXNGaWVsZERlZihjaGFubmVsRGVmKSkge1xuICAgICAgZmllbGREZWYgPSBjaGFubmVsRGVmO1xuICAgICAgc3BlY2lmaWVkU2NhbGUgPSBjaGFubmVsRGVmLnNjYWxlO1xuICAgIH0gZWxzZSBpZiAoaGFzQ29uZGl0aW9uYWxGaWVsZERlZihjaGFubmVsRGVmKSkge1xuICAgICAgZmllbGREZWYgPSBjaGFubmVsRGVmLmNvbmRpdGlvbjtcbiAgICAgIHNwZWNpZmllZFNjYWxlID0gY2hhbm5lbERlZi5jb25kaXRpb25bJ3NjYWxlJ107IC8vIFdlIHVzZSBbJ3NjYWxlJ10gc2luY2Ugd2Uga25vdyB0aGF0IGNoYW5uZWwgaGVyZSBoYXMgc2NhbGUgZm9yIHN1cmVcbiAgICB9IGVsc2UgaWYgKGNoYW5uZWwgPT09IFgpIHtcbiAgICAgIGZpZWxkRGVmID0gZ2V0RmllbGREZWYoZW5jb2RpbmcueDIpO1xuICAgIH0gZWxzZSBpZiAoY2hhbm5lbCA9PT0gWSkge1xuICAgICAgZmllbGREZWYgPSBnZXRGaWVsZERlZihlbmNvZGluZy55Mik7XG4gICAgfVxuXG4gICAgaWYgKGZpZWxkRGVmICYmIHNwZWNpZmllZFNjYWxlICE9PSBudWxsICYmIHNwZWNpZmllZFNjYWxlICE9PSBmYWxzZSkge1xuICAgICAgc3BlY2lmaWVkU2NhbGUgPSBzcGVjaWZpZWRTY2FsZSB8fCB7fTtcbiAgICAgIGNvbnN0IHNwZWNpZmllZFNjYWxlVHlwZSA9IHNwZWNpZmllZFNjYWxlLnR5cGU7XG4gICAgICBjb25zdCBzVHlwZSA9IHNjYWxlVHlwZShzcGVjaWZpZWRTY2FsZS50eXBlLCBjaGFubmVsLCBmaWVsZERlZiwgbWFyaywgY29uZmlnLnNjYWxlKTtcbiAgICAgIHNjYWxlQ29tcG9uZW50c1tjaGFubmVsXSA9IG5ldyBTY2FsZUNvbXBvbmVudChcbiAgICAgICAgbW9kZWwuc2NhbGVOYW1lKGNoYW5uZWwgKyAnJywgdHJ1ZSksXG4gICAgICAgIHt2YWx1ZTogc1R5cGUsIGV4cGxpY2l0OiBzcGVjaWZpZWRTY2FsZVR5cGUgPT09IHNUeXBlfVxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIHNjYWxlQ29tcG9uZW50cztcbiAgfSwge30pO1xufVxuXG5jb25zdCBzY2FsZVR5cGVUaWVCcmVha2VyID0gdGllQnJlYWtCeUNvbXBhcmluZyhcbiAgKHN0MTogU2NhbGVUeXBlLCBzdDI6IFNjYWxlVHlwZSkgPT4gKHNjYWxlVHlwZVByZWNlZGVuY2Uoc3QxKSAtIHNjYWxlVHlwZVByZWNlZGVuY2Uoc3QyKSlcbik7XG5cblxuZnVuY3Rpb24gcGFyc2VOb25Vbml0U2NhbGVDb3JlKG1vZGVsOiBNb2RlbCkge1xuICBjb25zdCBzY2FsZUNvbXBvbmVudHM6IFNjYWxlQ29tcG9uZW50SW5kZXggPSBtb2RlbC5jb21wb25lbnQuc2NhbGVzID0ge307XG5cbiAgY29uc3Qgc2NhbGVUeXBlV2l0aEV4cGxpY2l0SW5kZXg6IHtcbiAgICAvLyBVc2luZyBNYXBwZWQgVHlwZSB0byBkZWNsYXJlIHR5cGUgKGh0dHBzOi8vd3d3LnR5cGVzY3JpcHRsYW5nLm9yZy9kb2NzL2hhbmRib29rL2FkdmFuY2VkLXR5cGVzLmh0bWwjbWFwcGVkLXR5cGVzKVxuICAgIFtrIGluIFNjYWxlQ2hhbm5lbF0/OiBFeHBsaWNpdDxTY2FsZVR5cGU+XG4gIH0gPSB7fTtcbiAgY29uc3QgcmVzb2x2ZSA9IG1vZGVsLmNvbXBvbmVudC5yZXNvbHZlO1xuXG4gIC8vIFBhcnNlIGVhY2ggY2hpbGQgc2NhbGUgYW5kIGRldGVybWluZSBpZiBhIHBhcnRpY3VsYXIgY2hhbm5lbCBjYW4gYmUgbWVyZ2VkLlxuICBmb3IgKGNvbnN0IGNoaWxkIG9mIG1vZGVsLmNoaWxkcmVuKSB7XG4gICAgcGFyc2VTY2FsZUNvcmUoY2hpbGQpO1xuXG4gICAgLy8gSW5zdGVhZCBvZiBhbHdheXMgbWVyZ2luZyByaWdodCBhd2F5IC0tIGNoZWNrIGlmIGl0IGlzIGNvbXBhdGlibGUgdG8gbWVyZ2UgZmlyc3QhXG4gICAga2V5cyhjaGlsZC5jb21wb25lbnQuc2NhbGVzKS5mb3JFYWNoKChjaGFubmVsOiBTY2FsZUNoYW5uZWwpID0+IHtcbiAgICAgIC8vIGlmIHJlc29sdmUgaXMgdW5kZWZpbmVkLCBzZXQgZGVmYXVsdCBmaXJzdFxuICAgICAgcmVzb2x2ZS5zY2FsZVtjaGFubmVsXSA9IHJlc29sdmUuc2NhbGVbY2hhbm5lbF0gfHwgZGVmYXVsdFNjYWxlUmVzb2x2ZShjaGFubmVsLCBtb2RlbCk7XG5cbiAgICAgIGlmIChyZXNvbHZlLnNjYWxlW2NoYW5uZWxdID09PSAnc2hhcmVkJykge1xuICAgICAgICBjb25zdCBleHBsaWNpdFNjYWxlVHlwZSA9IHNjYWxlVHlwZVdpdGhFeHBsaWNpdEluZGV4W2NoYW5uZWxdO1xuICAgICAgICBjb25zdCBjaGlsZFNjYWxlVHlwZSA9IGNoaWxkLmNvbXBvbmVudC5zY2FsZXNbY2hhbm5lbF0uZ2V0V2l0aEV4cGxpY2l0KCd0eXBlJyk7XG5cbiAgICAgICAgaWYgKGV4cGxpY2l0U2NhbGVUeXBlKSB7XG4gICAgICAgICAgaWYgKHNjYWxlQ29tcGF0aWJsZShleHBsaWNpdFNjYWxlVHlwZS52YWx1ZSwgY2hpbGRTY2FsZVR5cGUudmFsdWUpKSB7XG4gICAgICAgICAgICAvLyBtZXJnZSBzY2FsZSBjb21wb25lbnQgaWYgdHlwZSBhcmUgY29tcGF0aWJsZVxuICAgICAgICAgICAgc2NhbGVUeXBlV2l0aEV4cGxpY2l0SW5kZXhbY2hhbm5lbF0gPSBtZXJnZVZhbHVlc1dpdGhFeHBsaWNpdDxWZ1NjYWxlLCBTY2FsZVR5cGU+KFxuICAgICAgICAgICAgICBleHBsaWNpdFNjYWxlVHlwZSwgY2hpbGRTY2FsZVR5cGUsICd0eXBlJywgJ3NjYWxlJywgc2NhbGVUeXBlVGllQnJlYWtlclxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gT3RoZXJ3aXNlLCB1cGRhdGUgY29uZmxpY3RpbmcgY2hhbm5lbCB0byBiZSBpbmRlcGVuZGVudFxuICAgICAgICAgICAgcmVzb2x2ZS5zY2FsZVtjaGFubmVsXSA9ICdpbmRlcGVuZGVudCc7XG4gICAgICAgICAgICAvLyBSZW1vdmUgZnJvbSB0aGUgaW5kZXggc28gdGhleSBkb24ndCBnZXQgbWVyZ2VkXG4gICAgICAgICAgICBkZWxldGUgc2NhbGVUeXBlV2l0aEV4cGxpY2l0SW5kZXhbY2hhbm5lbF07XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNjYWxlVHlwZVdpdGhFeHBsaWNpdEluZGV4W2NoYW5uZWxdID0gY2hpbGRTY2FsZVR5cGU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8vIE1lcmdlIGVhY2ggY2hhbm5lbCBsaXN0ZWQgaW4gdGhlIGluZGV4XG4gIGtleXMoc2NhbGVUeXBlV2l0aEV4cGxpY2l0SW5kZXgpLmZvckVhY2goKGNoYW5uZWw6IFNjYWxlQ2hhbm5lbCkgPT4ge1xuICAgIC8vIENyZWF0ZSBuZXcgbWVyZ2VkIHNjYWxlIGNvbXBvbmVudFxuICAgIGNvbnN0IG5hbWUgPSBtb2RlbC5zY2FsZU5hbWUoY2hhbm5lbCwgdHJ1ZSk7XG4gICAgY29uc3QgdHlwZVdpdGhFeHBsaWNpdCA9IHNjYWxlVHlwZVdpdGhFeHBsaWNpdEluZGV4W2NoYW5uZWxdO1xuICAgIHNjYWxlQ29tcG9uZW50c1tjaGFubmVsXSA9IG5ldyBTY2FsZUNvbXBvbmVudChuYW1lLCB0eXBlV2l0aEV4cGxpY2l0KTtcblxuICAgIC8vIHJlbmFtZSBlYWNoIGNoaWxkIGFuZCBtYXJrIHRoZW0gYXMgbWVyZ2VkXG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBtb2RlbC5jaGlsZHJlbikge1xuICAgICAgY29uc3QgY2hpbGRTY2FsZSA9IGNoaWxkLmNvbXBvbmVudC5zY2FsZXNbY2hhbm5lbF07XG4gICAgICBpZiAoY2hpbGRTY2FsZSkge1xuICAgICAgICBjaGlsZC5yZW5hbWVTY2FsZShjaGlsZFNjYWxlLmdldCgnbmFtZScpLCBuYW1lKTtcbiAgICAgICAgY2hpbGRTY2FsZS5tZXJnZWQgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIHNjYWxlQ29tcG9uZW50cztcbn1cbiJdfQ==