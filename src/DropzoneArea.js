import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';
import Snackbar from '@material-ui/core/Snackbar';  
import Dropzone from 'react-dropzone';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import Typography  from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import {convertBytesToMbsOrKbs} from './helpers/helpers'
import SnackbarContentWrapper from './SnackbarContentWrapper';
import PreviewList from './PreviewList';
import classNames from 'classnames';
const styles = {
   '@keyframes progress': {
     '0%': {
       backgroundPosition: '0 0',
     },
     '100%': {
       backgroundPosition: '-70px 0',
     },
   },
   dropZone: {
     position: 'relative',
     width: '100%',
     minHeight: '250px',
     backgroundColor: '#F0F0F0',
     border: 'dashed',
     borderColor: '#C8C8C8',
     cursor: 'pointer',
     boxSizing: 'border-box',
   },
   stripes: {
     border: 'solid',
     backgroundImage: 'repeating-linear-gradient(-45deg, #F0F0F0, #F0F0F0 25px, #C8C8C8 25px, #C8C8C8 50px)',
     animation: 'progress 2s linear infinite !important',
     backgroundSize: '150% 100%',
   },
   rejectStripes: {
     border: 'solid',
     backgroundImage: 'repeating-linear-gradient(-45deg, #fc8785, #fc8785 25px, #f4231f 25px, #f4231f 50px)',
     animation: 'progress 2s linear infinite !important',
     backgroundSize: '150% 100%',
   },
    dropzoneTextStyle:{
        textAlign: 'center'
    },
    uploadIconSize: {
        width: 51,
        height: 51,
        color: '#909090' 
    },
    dropzoneParagraph:{
        color: '#909090',
        marginBottom: 16,
        marginTop: 16
    }
}


class DropzoneArea extends Component{
    constructor(props){
        super(props);
        this.state = {
            fileObjects: [],
            openSnackBar: false,
            snackbarMessage: '',
            snackbarVariant: 'success',
            dropzoneText: props.dropzoneText,
            messages: props.messages,
        }
    }
    componentWillMount(){
        if(this.props.files){
            this.setState({fileObjects: this.props.files});
        }
        if(this.props.translations){
            this.setState({messages: {...this.props.messages, ...this.props.translations}});
        }
    }
    componentWillUnmount(){
        if(this.props.clearOnUnmount){
            this.setState({
                fileObjects: []
            })
        } 
    }
    componentDidUpdate(prevProps){
        if(this.props.dropzoneText !== prevProps.dropzoneText){
            this.setState({
                dropzoneText: this.props.dropzoneText
            });
        }

    }
    onDrop(files){
        const _this = this;
        if(this.state.fileObjects.length + files.length > this.props.filesLimit){
            const msg = this.state.messages.fileLimitExceeded.replace('%limit', this.props.filesLimit)
            this.setState({
                openSnackBar: true,
                snackbarMessage: msg,
                snackbarVariant: 'error'
            });
            this.props.onError([msg]);
        }else{
            var count = 0;
            var message = '';
            files.forEach((file) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    _this.setState({
                        fileObjects: _this.state.fileObjects.concat({file: file, data: event.target.result})
                    },() => {
                        if(this.props.onChange){
                            this.props.onChange(_this.state.fileObjects.map(fileObject => fileObject.file));    
                        }
                        // return full fileObjects to reuse for existing files preview outside of library
                        if(this.props.onChangeFull){
                            this.props.onChangeFull(_this.state.fileObjects);
                        }
                        if(this.props.onDrop){
                            this.props.onDrop(file)
                        }
                        message += this.state.messages.fileSuccessfullyAdded.replace('%name', file.name);
                        count++; // we cannot rely on the index because this is asynchronous
                        if(count === files.length){
                            // display message when the last one fires
                            this.setState({
                                openSnackBar: true,
                                snackbarMessage: message, 
                                snackbarVariant: 'success'
                            });
                        }
                    });
                };
                reader.readAsDataURL(file);
            })
        }
    }
    handleRemove = fileIndex => event => {
        event.stopPropagation();
        const {fileObjects} = this.state;
        const file = fileObjects.filter((fileObject, i) => { return i === fileIndex})[0].file;
        fileObjects.splice(fileIndex, 1);
        this.setState(fileObjects,() => {
            if(this.props.onDelete){
                this.props.onDelete(file);    
            }
            if(this.props.onChange){
                this.props.onChange(this.state.fileObjects.map(fileObject => fileObject.file));
            }
            this.setState({
                openSnackBar: true,
                snackbarMessage: this.state.messages.fileRemoved.replace('%name', file.name),
                snackbarVariant: 'info'
            });
        });
    }
    handleError(rejectedFiles) {
        if(this.props.onError){
            const messagesBag = [];
            rejectedFiles.forEach((rejectedFile) => {
                if(!this.props.acceptedFiles.includes(rejectedFile.type)){
                    messagesBag.push(this.state.messages.fileTypeNotSupported);
                }
                if(rejectedFile.size > this.props.maxFileSize){
                    messagesBag.push(this.state.messages.fileTooBig.replace('%limit', convertBytesToMbsOrKbs(this.props.maxFileSize)));
                }
            });
            this.props.onError(messagesBag);
        }
    }
    handleDropRejected(rejectedFiles, evt) {
        var message = '';
        rejectedFiles.forEach((rejectedFile) => {
            message = this.state.messages.fileWasRejected.replace('%name', rejectedFile.name);
            if(!this.props.acceptedFiles.includes(rejectedFile.type)){
                message += ' '+this.state.messages.fileTypeNotSupported
            }
            if(rejectedFile.size > this.props.maxFileSize){
                message += ' '+this.state.messages.fileTooBig.replace('%limit', convertBytesToMbsOrKbs(this.props.maxFileSize));
            }
        });
        if(this.props.onDropRejected){
            this.props.onDropRejected(rejectedFiles, evt);
        }
        this.setState({
            openSnackBar: true,
            snackbarMessage: message,
            snackbarVariant: 'error'
        });
    }
    onCloseSnackbar = () => {
        this.setState({
            openSnackBar: false,
        });
    };
    render(){
        const {classes} = this.props;
        const showPreviews = this.props.showPreviews && this.state.fileObjects.length > 0;
        const showPreviewsInDropzone = this.props.showPreviewsInDropzone && this.state.fileObjects.length > 0;
        return (
            <Fragment>
                <Dropzone
                    accept={this.props.acceptedFiles.join(',')}
                    onDrop={this.onDrop.bind(this)}
                    onDropRejected={this.handleDropRejected.bind(this)}
                    className={classNames(classes.dropZone,this.props.dropZoneClass)}
                    acceptClassName={classes.stripes}
                    rejectClassName={classes.rejectStripes}
                    maxSize={this.props.maxFileSize}
                     >
                    <div className={classes.dropzoneTextStyle}>
                        <Typography variant="h5" className={classNames(classes.dropzoneParagraph,this.props.dropzoneParagraphClass)}>
                            {this.state.dropzoneText}
                        </Typography>
                        <CloudUploadIcon className={classes.uploadIconSize}/>
                    </div>
                    {showPreviewsInDropzone &&
                        <PreviewList 
                            fileObjects={this.state.fileObjects} 
                            handleRemove={this.handleRemove.bind(this)}
                            showFileNames={this.props.showFileNamesInPreview}
                        />
                    }
                </Dropzone>
                {showPreviews &&
                    <Fragment>
                        <Grid container>
                            <span>Preview:</span>
                        </Grid>
                        <PreviewList 
                            fileObjects={this.state.fileObjects} 
                            handleRemove={this.handleRemove.bind(this)}
                            showFileNames={this.props.showFileNamesInPreview}
                        />
                    </Fragment>
                }
                {this.props.showAlerts &&
                    <Snackbar
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left',
                        }}
                        open={this.state.openSnackBar}
                        autoHideDuration={6000}
                        onClose={this.onCloseSnackbar}
                        >
                        <SnackbarContentWrapper
                            onClose={this.onCloseSnackbar}
                            variant={this.state.snackbarVariant}
                            message={this.state.snackbarMessage}
                        />
                    </Snackbar>              
                }
            </Fragment>
        )
    }
}

DropzoneArea.defaultProps = {
    acceptedFiles: ['image/*', 'video/*', 'application/*'],
    filesLimit: 3,
    maxFileSize: 3000000,
    dropzoneText: 'Drag and drop an image file here or click',
    showPreviews: false, // By default previews show up under in the dialog and inside in the standalone
    showPreviewsInDropzone: true,
    showFileNamesInPreview: false,
    showAlerts: true,
    clearOnUnmount: true,
    onChange: () => {},
    onDrop: () => {},
    onDropRejected: () => {},
    onDelete: () => {},
    onChangeFull: () => {},
    onError: () => {},
    files: [],

    // translations
    messages: {
        fileTypeNotSupported: "File type not supported.",
        fileTooBig: "File is too big. Size limit is %limit.",
        fileLimitExceeded: "Maximum allowed number of files exceeded. Only %limit allowed",
        fileWasRejected: "File %name was rejected.",
        fileRemoved: "File %name removed.",
        fileSuccessfullyAdded: "File %name successfully added."
    }
}
DropzoneArea.propTypes = {
    acceptedFiles: PropTypes.array,
    filesLimit: PropTypes.number,
    maxFileSize: PropTypes.number,
    dropzoneText: PropTypes.string,
    showPreviews: PropTypes.bool,
    showPreviewsInDropzone: PropTypes.bool,
    showFileNamesInPreview: PropTypes.bool,
    showAlerts: PropTypes.bool,
    clearOnUnmount: PropTypes.bool, 
    onChange: PropTypes.func,
    onDrop: PropTypes.func,
    onDropRejected: PropTypes.func,
    onDelete: PropTypes.func,
    onChangeFull: PropTypes.func,
    onError: PropTypes.func,
    files: PropTypes.array,
    translations: PropTypes.objectOf(PropTypes.string),
}
export default withStyles(styles)(DropzoneArea)
