// 
// vselect 1.0
// 
// @link	https://github.com/visvoy/vselect
// @author	visvoy@gmail.com
// 
(function($,d,w){
var 
ie=!!w.ActiveXObject,
ie6=ie&&!w.XMLHttpRequest,

// 
// configure:
// 

// 全局配置
config={
	// 下拉框显示速度
	speed:"fast",
	
	// 使用阴影效果？（默认动画已经很骚气了，更炫的需求才使用阴影吧）
	shadow:false
},

// 全局样式
style={
	select:"vselect",
	linkOn:"vselect-link-on",
	panel:"vselect-panel",
	shadow:"vselect-shadow",
	tab:"vselect-panel-tab",
	tabOn:"vselect-panel-tab-on",
	tabHover:"vselect-panel-tab-hover"
},

// 新建vselect的配置选项
defaultOptions={
	// 指定默认值
	defaultValue:null,
	
	// 指定默认文案
	defaultCaption:null,
	
	// optgroup模式里面没有分组的标签名
	grouplessLabel:'其他',
	
	// 下拉框弹出方向：top, bottom
	// 默认是居中向上下拉伸
	direction:'center',
	
	// 为vselect指定css style
	styleString:null,
	
	// select宽度，不设置就使用css的宽度
	width:null,
	
	// 下拉框最大高度，超出这个高度将分成多列显示
	maxHeight:320,
	
	// 下拉框最多可以分几列，超出最大列数将无视maxHeight，继续增高下拉框
	maxColumn:5,
	
	// 下拉框的顶部最大允许坐标
	maxTop:0
},

// 
// private:
// 

autoIndex=1,
shadowObj=null,
activePanel=[];

// Check if value [v] is undefined
function no(v){
	return typeof v=="undefined";
}

// Check if value [v] is a function
function isfn(v){
	return typeof v=="function";
}

// get window scroll position and size for all browers
function scrollPos(){
	var p={left:0,top:0,width:0,height:0};
	if(self.innerHeight){
		p.height=self.innerHeight;
		p.width=self.innerWidth;
		p.left=self.pageXOffset;
		p.top=self.pageYOffset;
	}else if(ie6){
		p.height=d.documentElement.clientHeight;
		p.width=d.documentElement.clientWidth;
		p.top=d.documentElement.scrollTop;
		p.left=d.documentElement.scrollLeft;
	}else if(d.body){
		p.height=d.body.clientHeight;
		p.width=d.body.clientWidth;
		p.left=d.body.scrollLeft;
		p.top=d.body.scrollTop;
	}
	return p;
}

// 初始化vselect插件
var vselectInited=false;
function vselectInit(){
	vselectInited=true;
	
	// sync actived panel position when window is resizing
	$(w).resize(function(){
		if(activePanel.length<1)return;
		var i,that,panel,pos;
		for(i=0;i<activePanel.length;i++){
			that=activePanel[i];
			panel=that._panel;
			pos=fn.panelPosition(that,panel,fn.options(that));
			panel.css({left:pos.x,top:pos.y});
		}
	});
	
	// make panel foldup when user clicks other item of this page
	$(d).click(function(e){
		var ob=$(e.srcElement?e.srcElement:e.target),papa,tmp;
		if(ob.hasClass(style.panel)||ob.hasClass(style.select)||ob.hasClass(style.tab))
			return;

		papa=ob.parent();
		if(papa.hasClass(style.select)||papa.hasClass(style.tab))
			return;

		papa=papa.parent().parent();
		if(papa.hasClass(style.panel)){
			if(tmp=papa.attr("id")){
				tmp=$("a[rel='"+tmp+"']:first")[0];
				if(tmp&&typeof tmp._multiple!="undefined"&&tmp._multiple)
					return;
			}
		}
		fn.panelClean();
	}).keyup(function(e){
		// foldup panel when "ESC" key pressed
		if(!e)e=w.event;
		var code=(e.keyCode?e.keyCode:e.which);
		if(27==code)fn.panelClean();
	});
	
	// init panel shadow
	$("body:first").append('<div class="'+style.shadow+'" id="__'
		+style.select+'_shadow" style="display:none">&nbsp;</div>');
	shadowObj=$("#__"+style.select+"_shadow");
}

var fn={

init:function(options){
	if(!vselectInited)vselectInit();
	options=options||{};
	for(var k in defaultOptions){
		if(typeof options[k]=="undefined"){
			options[k]=defaultOptions[k];
		}
	}
	return this.each(function(){
		if(no(this.nodeName))return;
		k=this.nodeName.toLowerCase()+'Init';
		if(isfn(fn[k])){
			fn[k].call(this,options);
		}
	});
},

// 创建一个panel块
_createBlock:function(that){
	var htm='',item=$(that).find("> option"),i;
	for(i=0;i<item.length;i++){
		if(no(item[i].text)){
			item[i].text=item[i].value;
		}
		htm+='<li><a href="javascript:;" rel="'+item[i].value+'">'+item[i].text+'</a></li>';
	}
	return '<ul>'+htm+'</ul>';
},

// 创建select替换内容
_createHtml:function(id,name,that,options){
	var htm,idText,nameText,autoId=autoIndex,title,css;
	autoIndex++;
	
	htm=fn._createBlock(that);
	idText=(id?' id="'+id+'" ':'');
	nameText=(name?' name="'+name+'" ':'');
	title=that.getAttribute('title')?' title="'+that.getAttribute('title')+'" ':'';
	css=options.styleString?' style="'+options.styleString+'" ':'';
	
	$(that).after('<a href="javascript:;" class="'+style.select+'" rel="__'+style.select+autoId+'"'+title+css+'>'
		+'<input type="hidden" '+idText+nameText+' value="" />'
		+'<em></em><i>&#9660;</i></a>');
	$("body:first").append('<div class="'+style.panel+'" id="__'
		+style.select+autoId+'" style="display:none">'+htm+'</div>');
	return autoId;
},

// 创建select替换内容（支持optgroup标签）
_createHtmlWithOptgroup:function(id,name,that,options){
	var htm='',i,idText,nameText,tab='',index=0,autoId=autoIndex,item,title,css;
	autoIndex++;
	
	// find options inside optgroup
	item=$(that).find("optgroup");
	for(i=0;i<item.size();i++){
		index++;
		tab+='<em>'+(item[i].label||index)+'</em>';
		htm+=fn._createBlock(item[i]);
	}
	
	// find options without optgroup
	if($(that).find("> option").size()>0){
		index++;
		tab+='<em>'+options.grouplessLabel+'</em>';
		htm+=fn._createBlock(that);
	}
	
	idText=(id?' id="'+id+'" ':'');
	nameText=(name?' name="'+name+'" ':'');
	title=that.getAttribute('title')?' title="'+that.getAttribute('title')+'" ':'';
	css=options.styleString?' style="'+options.styleString+'" ':'';
	
	$(that).after('<a href="javascript:;" class="'+style.select+'" rel="__'+style.select+autoId+'"'+title+css+'>'
		+'<input type="hidden" '+idText+nameText+' value="" />'
		+'<em></em><i>&#9660;</i></a>');
	$("body:first").append('<div class="'+style.panel+'" id="__'
		+style.select+autoId+'" style="display:none">'
		+'<div class="'+style.tab+'">'+tab+'</div>'+htm+'</div>');
	return autoId;
},

// 初始化一个vselect
selectInit:function(options){
	var that=this,me=$(that),ob,id=that.id,name=that.name,selected,group,autoId;

	if(!name&&!id)return;
	
	// make jform element
	if($(that).find("optgroup").size()<1){
		autoId=fn._createHtml(id,name,that,options);
		group=false;
	}else{ // with optgroup
		autoId=fn._createHtmlWithOptgroup(id,name,that,options);
		group=true;
	}
	ob=me.next();
	that=ob[0];
	
	// init vars
	that._options = options;
	that._panel   = $("#__"+style.select+autoId);
	that._value   = ob.find("input:first");
	that._caption = ob.find("em:first");
	if(options.width>0){
		ob.css("width",options.width);
	}
	that._selectWidth       = ob.width();
	that._group             = group;
	that._multiple          = this.multiple;
	that._initSelectedIndex = this.options.selectedIndex;
	that._origMaxHeight		= options.maxHeight;
	
	// init panel
	if(!group){
		fn.panelInit(that,that._panel,options);
		fn.panelArrange(that,that._panel,options);
	}else{ // with optgroup
		that._tab=that._panel.find("div."+style.tab+":first");
		fn.panelInitWithOptgroup(that,that._panel,options);
		fn.panelArrangeWithOptgroup(that,that._panel,options);
	}
	
	// init event
	// 在ipad下面，要继承options.change事件到me
	ob.click(fn.selectClick);
	if(isfn(options.change)){
		that._value.change(options.change);
	}
	
	// cleanup
	me.remove();
},

// 初始化一个panel块
_panelBlockInit:function(that,ul){
	var i,item=$(ul).find("a");
	for(i=0;i<item.length;i++){
        if(no(item[i].rel))continue;
		item[i].onclick=function(e){
			fn.itemClick.call(that,e,this.rel,this.innerHTML);
		};
	}
},

// 初始化vselect默认值
_panelValueInit:function(that,panel,options){
	var val='',caption='';
	
	if(that._initSelectedIndex>-1){
		var ob=panel.find("a:eq("+that._initSelectedIndex+")");
		val=ob.attr("rel");
		caption=ob.text();
	}
	
	if(null!==options.defaultValue){
		val=options.defaultValue;
		caption=(null===options.defaultCaption?val:options.defaultCaption);
	}

	fn.selectSetValue.call(that,val,caption,options);
},

// 初始化一个panel
panelInit:function(that,panel,options){
	fn._panelBlockInit(that,panel);
	fn._panelValueInit(that,panel,options);
},

// 计算一个panel的合理宽高
panelArrange:function(that,panel,options){
	var border=fn.borderSize(panel),
		gridWidth=$(that).outerWidth()-border.width,
		n=1;
	
	panel.find("ul").hide().eq(0).css("display","block");	
	panel.css({width:gridWidth,height:"auto"}).find("li").css("width",gridWidth);
	while((that._panelHeight=panel.height())>options.maxHeight){
		if(++n<=options.maxColumn){
			panel.css("width",gridWidth*n);
		}else{
			options.maxHeight=panel.height();
			break;
		}
	}
},

// 初始化一个panel（支持optgroup标签）
panelInitWithOptgroup:function(that,panel,options){
	// init tab
	panel.find("div."+style.tab+" em").hover(function(){
		$(this).addClass(style.tabHover);
	},function(){
		$(this).removeClass(style.tabHover);
	}).each(function(idx){
		this.onclick=function(){
			fn.panelTabClick(that,idx);
		};
	});
	
	// init tab block content
	panel.find("> ul").each(function(){
		fn._panelBlockInit(that,this);
	});
	
	fn._panelValueInit(that,panel,options);
},

// 计算一个panel的合理宽高（支持optgroup标签）
panelArrangeWithOptgroup:function(that,panel,options){
	var border=fn.borderSize(panel),
		gridWidth=$(that).outerWidth()-border.width,
		blocks=panel.find("> ul"),n;
		
	if(blocks.length<1)return;
		
	that._panelWidth=0;
	that._panelHeight=0;
	that._panelTabWidth=0;
	that._panelTabHeight=0;
	gridHeight=panel.find("li:first").height();
	
	// find max width firset
	blocks.each(function(){
		var ul=$(this),n=1,tempHeight;
		
		// when calc tab block size, we must hide other blocks temporary
		blocks.hide();
		ul.css("display","block");
		
		panel.css({width:gridWidth,height:"auto"});
		ul.find("li").css("width",gridWidth);
		while((tempHeight=panel.height())>options.maxHeight){
			if(++n<=options.maxColumn){
				panel.css("width",gridWidth*n);
			}else{
				break;
			}
		}
		
		that._panelWidth=Math.max(panel.width(),that._panelWidth);
	});
	
	// then find max height
	blocks.each(function(){
		var ul=$(this),n=1,tempHeight;
		
		// when calc tab block size, we must hide other blocks temporary
		blocks.hide();
		ul.css("display","block");
		
		panel.css({width:that._panelWidth,height:"auto"});
		ul.find("li").css("width",gridWidth);
		while((tempHeight=panel.height())>options.maxHeight){
			if(++n<=options.maxColumn){
				panel.css("width",gridWidth*n);
			}else{
				options.maxHeight=panel.height();
				break;
			}
		}

		that._panelHeight=Math.max(panel.height(),that._panelHeight);
	});
	
	// active first selected tab
	fn.panelActiveSelectedTab(that);
},

// 激活首个有选中选项的tab页
panelActiveSelectedTab:function(that){
	var idx,blocks=that._panel.find("> ul");
	for(idx=0;idx<blocks.length;idx++){
		if(blocks.eq(idx).find("a."+style.linkOn).length>0)
			break;
	}
	if(idx>=blocks.length)idx=0;
	blocks.hide().eq(idx).show();
	that._tab.find("em").removeClass(style.tabOn).eq(idx).addClass(style.tabOn);
},

// 一个tab标签被点击的事件
panelTabClick:function(that,index){
	var tab=that._panel.find("div."+style.tab);
	tab.find("em").removeClass(style.tabOn).eq(index).addClass(style.tabOn);
	that._panel.find("> ul").hide().eq(index).show();
	that._panel.css({width:that._panelWidth,height:that._panelHeight});
},

// 计算panel正确显示的位置
panelPosition:function(that,panel,options,usePanelLeft){
	var p=scrollPos(),me=$(that),options=fn.options(that),border,px,py,pw,ph;
	border=fn.borderSize(panel);
	pw=(that._group?that._panelWidth:panel.width());
	ph=Math.min(that._panelHeight,options.maxHeight);
	px=(usePanelLeft?panel.offset().left:me.offset().left);
	switch(options.direction){
	case "top":
		py=me.offset().top+me.outerHeight()-ph-border.height;
		break;
	case "bottom":
		py=me.offset().top;
		break;
	default:
		py=me.offset().top+(me.outerHeight()>>1)-(ph>>1)-(border.height>>1);
	}
	
	// top aligned
	if(py<p.top+options.maxTop){
		py=me.offset().top;
	}
	// bottom aligned
	if(py+ph>p.top+p.height){
		py=me.offset().top+me.outerHeight()-ph-border.height;
	}
	
	// check window range
	if(py+ph>p.top+p.height){
		py=p.top+p.height-ph-border.height;
	}
	if(px+pw>p.left+p.width){
		px=p.left+p.width-pw-border.width;
	}
	if(px<0){
		px=0;
	}
	if(py<0){
		py=options.maxTop;
	}
	
	return {x:px,y:py,w:pw,h:ph};
},

// 一个vselect被点击的事件
selectClick:function(e){
	var that=this,me=$(that),options=fn.options(that),border,panel=that._panel,pos;

	// cleanup first
	e=e||w.event;
	if(e.stopPropagation)e.stopPropagation();
	else e.cancelBubble=true;
    fn.panelClean();
	me.blur();
	
	if(panel.is(":visible"))return;
    
	border=fn.borderSize(panel);
	panel.show().css({
		// opacity:1,
		height:(me.outerHeight()-border.height),
		left:me.offset().left,
		top:me.offset().top
	});
	if(that._group){
		panel.css("width",that._panelWidth);
	}
	pos=fn.panelPosition(that,panel,options,true);
	that._panel.animate({height:pos.h,left:pos.x,top:pos.y},config.speed,function(){
		if(isfn(options.show))options.show.call(that);
	});
	if(config.shadow){
		shadowObj.show()
			.css({
				width:panel.width(),
				height:(me.outerHeight()-border.height),
				left:me.offset().left,
				top:me.offset().top
			})
			.animate({height:pos.h,left:(pos.x+6),top:(pos.y+6)},config.speed);
	}
	activePanel.push(that);
},

// 一个option被点击的事件
itemClick:function(e,val,caption){
	var that=this,options=fn.options(that);
	if(!that._multiple)fn.panelClean();
	fn.selectSetValue.call(that,val,caption,options);
    that._value.trigger("change");
},

// 重新填充vselect的数据
reset:function(newData,selectedValue){
	var that=this,panel=that._panel,options=fn.options(that),htm='',k;
	
	that._initSelectedIndex=0;
	options.maxHeight=that._origMaxHeight;

	for(k in newData){
		if(selectedValue==k){
			that._initSelectedIndex=i++;
		}
		htm+='<li><a href="javascript:;" rel="'+k+'">'+newData[k]+'</a></li>';
	}

	// should check optgroup later..
	
	panel.empty().html('<ul>'+htm+'</ul>');
	
	fn.panelInit(that,panel,options);
	fn.panelArrange(that,panel,options);
},

// 隐藏当前显示的panel
panelHide:function(){
	var that=this,options=fn.options(that),me=$(this),panel=this._panel,border=fn.borderSize(panel),z;
	z=panel.css('z-index');
	panel.css('z-index',z-1);
	panel.animate({
		// opacity:0.3,
		height:(me.outerHeight()-border.height),
		left:me.offset().left,
		top:me.offset().top
	},config.speed,function(){
		panel.hide();
		panel.css('z-index',z);
		if(isfn(options.hide))options.hide.call(that);
	});
	if(config.shadow){
		shadowObj.hide();
	}
},

// 隐藏所有panel
panelClean:function(){
    var ob;
    while(ob=activePanel.pop()){
		fn.panelHide.apply(ob);
    }
},

// 设置一个vselect的值，如果是optgroup的，将自动切换到相应的标签
selectSetValue:function(val,caption,options){
	var that=this,me=$(that),options=fn.options(that);
	if(!that._multiple){
		that._panel.find("a").removeClass(style.linkOn);
		that._panel.find("a[rel='"+val+"']").addClass(style.linkOn);
	}else{
		var tc=[],tv=[],i,r,item=that._panel.find("a");
		for(i=0;i<item.length;i++){
			r=item[i];
			if(!no(r.rel)&&r.rel==val){
				r.className=r.className.indexOf(style.linkOn)>-1?"":style.linkOn;
			}
			if(r.className.indexOf(style.linkOn)>-1){
				tc.push(r.innerHTML);
				tv.push(r.rel);
			}
		}
		if(tv.length>0||options.defaultValue===null){
			caption=tc.join(",");
			val=tv.join("|^|");
		}else{ // use default value when non selected
			val=options.defaultValue;
			caption=options.defaultCaption||options.defaultValue;
		}
	}
	
	that._caption.html(caption);
    that._value.val(val).attr("rel",caption);

	if(that._caption.width()+26>that._selectWidth){
		me.width(that._caption.width()+26);
	}
	if(that._caption.width()+26<that._selectWidth){
		me.width(that._selectWidth);
	}
	
	// use text underline to mark up selected optgroup tabs
	if(!that._group)return;
	var i,eqs={};
	that._tab.find("em").css("text-decoration","none");
	that._panel.find("a."+style.linkOn).each(function(){
		eqs[$(this).parent().parent().index()-1]=1;
	});
	for(i in eqs){
		that._tab.find("em:eq("+i+")").css("text-decoration","underline");
	}
},

// 根据nodeName调用对应的方法
_castByType:function(type){
	if(typeof this.nodeName!="string")return;
	var k=this.nodeName.toLowerCase()+type;
	if(isfn(fn[k])){
		fn[k].call(this);
	}
},

// 显示一个元素（根据元素的nodeName确定调用哪个方法）
showItem:function(){
	this.each(function(){
		fn._castByType.call(this,"Show");
	});
},

// 隐藏一个元素（根据元素的nodeName确定调用哪个方法）
hideItem:function(){
	this.each(function(){
		fn._castByType.call(this,"Hide");
	});
},

// 计算一个dom的边框厚度
borderSize:function(ob){
	var tmp=$(ob);
	return {
		width:(parseInt(tmp.css("border-left-width"))+parseInt(tmp.css("border-right-width"))),
		height:(parseInt(tmp.css("border-top-width"))+parseInt(tmp.css("border-bottom-width")))
	}
},

// 获取一个vselect的配置
options:function(ob){
	return(ob._options?ob._options:{});
},

// 获取一个vselect的当前值
value:function(){
	if(this._value)return this._value.val();
	return this.value;
},

// 为vselect设置一个值，并且切换到相应的tab页（optgroup模式）
setValue:function(val){
	this._panel.find("a[rel='"+val+"']").trigger("click");
	if(this._tab)fn.panelActiveSelectedTab(this);
},

// 获得当前vselect的选中文案
caption:function(){
	if(this._value)return this._value[0].getAttribute('rel');
	return this.getAttribute('rel');
}

}; // var fn

// 
// public:
// 

$.vselect={
	// Get config [key] value
	config:function(key){
		return(typeof config[key]=="undefined"?undefined:config[key]);
	},
	
	// Set config [key] to [val]
	setConfig:function(key,val){
		switch(typeof key){
		case "object":
			for(var k in key){
				config[k]=key[k];
			}
			return;
		case "array":
			for(var k=0;k<key.length;k++){
				config[k]=key[k];
			}
			return;
		}
		config[key]=val;
	},
	
	// Get style [key] value
	style:function(key){
		return(typeof style[key]=="undefined"?undefined:style[key]);
	},
	
	// Set style [key] to [val]
	setStyle:function(key,val){
		switch(typeof key){
		case "object":
			for(var k in key){
				style[k]=key[k];
			}
			return;
		case "array":
			for(var k=0;k<key.length;k++){
				style[k]=key[k];
			}
			return;
		}
		style[key]=val;
	},
	
	hide:fn.panelClean
};

$.fn.extend({
	vselect:function(){
	    fn.init.apply(this,arguments);
	},
	vselectShow:function(){
	    fn.showItem.apply(this,arguments);
	},
	vselectHide:function(){
	    fn.hideItem.apply(this,arguments);
	},
	vselectValue:function(){
		if(this.size()<1){
			return null;
		}
		return fn.value.apply(this[0]);
	},
	vselectSetValue:function(val){
		if(this.size()<1){
			return null;
		}
		return fn.setValue.call(this.parent()[0],val);
	},
	vselectCaption:function(){
		if(this.size()<1){
			return null;
		}
		return fn.caption.call(this[0]);
	},
	vselectReset:function(){
		var arg=arguments;
		return this.each(function(){
			if($(this).is("input:hidden")){
				fn.reset.apply($(this).parent()[0],arg);
				return;
			}
			if(this._panel){
				fn.reset.apply(this,arg);
				return;
			}
		});
	}
});
})(jQuery,document,window);