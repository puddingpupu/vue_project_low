import { computed, defineComponent, inject, ref } from "vue";
import './editor.scss'
import EditorBlock from './editor_block'
import deepcopy from "deepcopy";
import { useMenuDragger } from "./useMenuDragger";
import { useFocus } from "./useFocus";
import { useBlockDragger } from "./useBlockDragger";
import { useCommands } from "./useCommands";
import { $dialog } from "@/components/Dialog";
import { ElButton } from "element-plus";
import { $dropdown, DropdownItem } from "../components/Dropdown"
import Editor_operator from "./editor_operator";


export default defineComponent({
    props: {
        modelValue: { type: Object },
        formData: { type: Object }
    },
    emits: ['update:modelValue'],
    setup(props, ctx) {
        //预览模式 开启的时候无法操作内容

        const previewRef = ref(false);
        const editorRef = ref(true);

        const data = computed({
            get() {
                return props.modelValue
            },
            set(newValue) {
                ctx.emit('update:modelValue', deepcopy(newValue))
            }
        });
        const containerStyles = computed(() => ({
            width: data.value.container.width + 'px',
            height: data.value.container.height + 'px'
        }))

        const config = inject('config')

        //将拖拽区元素变成可获取元素
        const containerRef = ref(null)
        //实现菜单拖拽功能
        const { dragstart, dragend } = useMenuDragger(containerRef, data)


        //实现获取焦点
        let { blockMousedown, focusData, containerMouseDown, lastSelectBlock, clearBlockFocus } = useFocus(data, previewRef, (e) => {
            //当触发mouseDown的时候调用回调函数
            mouseDown(e)
        });
        //实现拖拽多个元素
        const { mouseDown, markLine } = useBlockDragger(focusData, lastSelectBlock, data)
        const { commands } = useCommands(data, focusData);
        const buttons = [
            { label: '撤销', icon: 'icon-back', handler: () => { commands.undo() } },
            { label: '重做', icon: 'icon-forward', handler: () => { commands.redo() } },
            {
                label: '导出', icon: 'icon-out', handler: () => {
                    $dialog({
                        title: '导出json使用',
                        content: JSON.stringify(data.value),
                        footer: false
                    })
                }
            },
            {
                label: '导入', icon: 'icon-in', handler: () => {
                    $dialog({
                        title: '导入json使用',
                        content: '',
                        footer: true,
                        onConfirm(text) {
                            //    data.value=JSON.parse(text) //这种方式无法撤销重做
                            commands.updateContainer(JSON.parse(text));
                        }
                    })
                }
            },
            { label: '置顶', icon: 'icon-top', handler: () => commands.placeTop() },
            { label: '置底', icon: 'icon-bottom', handler: () => { commands.placeBottom() } },
            { label: '删除', icon: 'icon-delete', handler: () => { commands.delete() } },
            {
                label: () => previewRef.value ? "编辑" : "预览", icon: () => previewRef.value ?
                    "icon-edit" : "icon-look",
                handler: () => { previewRef.value = !previewRef.value; clearBlockFocus() }
            },
            { label: '关闭', icon: 'icon-close', handler: () => { editorRef.value = false; clearBlockFocus() } }
        ]
        const onContextMenuBlock = (e, block) => {
            e.preventDefault();

            $dropdown({
                el: e.target,
                content: () => {
                    return <>
                        <DropdownItem label="删除" icon="icon-delete" onClick={() => { commands.delete() }}></DropdownItem>
                        <DropdownItem label="置顶" icon="icon-top" onClick={() => { commands.placeTop() }}></DropdownItem>
                        <DropdownItem label="置底" icon="icon-bottom" onClick={() => { commands.placeBottom() }}></DropdownItem>
                        <DropdownItem label="查看" icon="icon-look" onClick={() => {
                            $dialog({
                                title: '查看节点数据',
                                content: JSON.stringify(block)
                            })
                        }}></DropdownItem>
                        <DropdownItem label="导入" icon="icon-in" onClick={() => {
                            $dialog({
                                title: '导入节点数据',
                                content: '',
                                footer: true,
                                onConfirm(text) {
                                    text = JSON.parse(text);
                                    commands.updateBlock(text, block)
                                }
                            })
                        }}></DropdownItem>
                    </>
                }

            })
        }


        
        
        //页面内容返回渲染
        return () => !editorRef.value ? <>
            <div
                class="editor_container_canvas_content"
                style={containerStyles.value}
                style="margin:auto;"
               
            >
                {
                    (data.value.blocks.map((block, index) => (
                        <EditorBlock

                            class={ 'editor_block_preview'}
                            block={block}
                            formData={props.formData}
                            onMousedown={(e) => blockMousedown(e, block, index)}
                        ></EditorBlock>

                    )))
                }

            </div>
            <div 
            style="margin:auto;">
                <ElButton type="primary" onClick={() => { editorRef.value = true }}>继续编辑
                </ElButton>
                {JSON.stringify(props.formData)}
            </div>

        </>
            : <div class="editor">
                <div class="editor_left">

                    {config.componentList.map(component => (
                        <div class="editor_left_item"
                            draggable
                            onDragstart={e => dragstart(e, component)}
                            onDragend={dragend}
                        >
                            <span>{component.label}</span>
                            <div>{component.preview()}</div>
                        </div>
                    ))}

                </div>
                <div class="editor_top">
                    {buttons.map((btn, index) => {
                        const icon = typeof btn.icon == 'function' ? btn.icon() : btn.icon
                        const label = typeof btn.label == 'function' ? btn.label() : btn.label
                        return <div class="editor_top_button" onClick={btn.handler}>
                            <i class={icon}></i>
                            <span>{label}</span>
                        </div>
                    })}
                </div>


                <div class="editor_right">
                    <Editor_operator
                        block={lastSelectBlock.value}
                        data={data.value}
                        updateContainer={commands.updateContainer}
                        updateBlock={commands.updateBlock}
                    ></Editor_operator>
                </div>


                <div class="editor_container">
                    <div class="editor_container_canvas">
                        <div
                            className="editor_container_canvas_content"
                            style={containerStyles.value}
                            ref={containerRef}
                            onMousedown={containerMouseDown}
                        >
                            {
                                //有map值报错！！！！！！！！！！！！！！
                                (data.value.blocks.map((block, index) => (
                                    // console.log(index),

                                    <EditorBlock
                                        class={block.focus ? 'editor_block_focus' : ''}
                                        class={previewRef.value ? 'editor_block_preview' : ''}
                                        block={block}
                                        onMousedown={(e) => blockMousedown(e, block, index)}
                                        onContextmenu={(e) => onContextMenuBlock(e, block)}
                                        formData={props.formData}
                                    ></EditorBlock>

                                )))
                            }
                            {markLine.y !== null && <div class="line-y" style={{ top: markLine.y + 'px' }}></div>}
                            {markLine.x !== null && <div class="line-x" style={{ left: markLine.x + 'px' }}></div>}
                        </div>

                    </div>

                </div>
            </div>
    }
})